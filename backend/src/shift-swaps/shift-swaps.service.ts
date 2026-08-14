import {
  Injectable, NotFoundException, BadRequestException, ConflictException, Optional, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ShiftSwapRequest, ShiftSwapRequestDocument } from './schemas/shift-swap.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

@Injectable()
export class ShiftSwapsService {
  constructor(
    @InjectModel(ShiftSwapRequest.name)
    private readonly swapModel: Model<ShiftSwapRequestDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @Optional() @Inject(OrdersGateway)
    private readonly ordersGateway?: OrdersGateway,
  ) {}

  /** Tạo yêu cầu đổi ca */
  async create(userId: string, dto: CreateShiftSwapDto): Promise<ShiftSwapRequestDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new NotFoundException('Không tìm thấy người dùng.');

    const currentShift = user.assignedShift || 'morning';
    if (currentShift === dto.requestedShift) {
      throw new BadRequestException('Ca làm mong muốn trùng với ca làm hiện tại của bạn.');
    }

    // Kiểm tra xem đã có yêu cầu chờ duyệt chưa
    const pending = await this.swapModel.findOne({ userId, status: 'pending' }).exec();
    if (pending) {
      throw new ConflictException('Bạn đang có 1 yêu cầu đổi ca chờ Admin duyệt.');
    }

    const created = new this.swapModel({
      userId,
      currentShift,
      requestedShift: dto.requestedShift,
      reason: dto.reason || '',
      status: 'pending',
    });
    const saved = await created.save();
    const populated = await this.swapModel.findById(saved._id).populate('userId', 'name email role assignedShift').exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.server?.emit('shiftSwapCreated', populated);
    }

    return populated || saved;
  }

  /** Lấy tất cả yêu cầu (Admin) */
  async findAll(): Promise<ShiftSwapRequestDocument[]> {
    return this.swapModel
      .find()
      .populate('userId', 'name email role assignedShift')
      .populate('approvedBy', 'name email')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Nhân viên xem danh sách yêu cầu của mình */
  async findMy(userId: string): Promise<ShiftSwapRequestDocument[]> {
    return this.swapModel
      .find({ userId })
      .populate('userId', 'name email role assignedShift')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Admin duyệt hoặc từ chối yêu cầu đổi ca */
  async updateStatus(id: string, status: 'approved' | 'rejected', adminId: string): Promise<ShiftSwapRequestDocument> {
    // Bug #5 fix: Validate status input trước khi lưu vào DB
    if (!['approved', 'rejected'].includes(status)) {
      throw new BadRequestException(`Trạng thái không hợp lệ. Chỉ chấp nhận: 'approved' hoặc 'rejected'.`);
    }

    const reqDoc = await this.swapModel.findById(id).exec();
    if (!reqDoc) throw new NotFoundException('Không tìm thấy yêu cầu đổi ca.');


    reqDoc.status = status;
    reqDoc.approvedBy = adminId as any;
    const saved = await reqDoc.save();

    // Nếu Admin bấm Duyệt ('approved') -> Cập nhật ca làm mặc định của nhân viên trong User Model
    if (status === 'approved') {
      await this.userModel.findByIdAndUpdate(reqDoc.userId, { assignedShift: reqDoc.requestedShift }).exec();
    }

    const populated = await this.swapModel
      .findById(saved._id)
      .populate('userId', 'name email role assignedShift')
      .populate('approvedBy', 'name email')
      .exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.server?.emit('shiftSwapUpdated', populated);
    }

    return populated || saved;
  }
}
