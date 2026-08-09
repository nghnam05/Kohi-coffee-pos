import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { StaffCall, StaffCallDocument } from './schemas/staff-call.schema.js';
import { CreateStaffCallDto } from './dto/create-staff-call.dto.js';

// Cooldown per table: 30 seconds
const COOLDOWN_MS = 30_000;

@Injectable()
export class StaffCallsService {
  // In-memory cooldown map: tableId → last call timestamp
  private readonly cooldowns = new Map<string, number>();

  constructor(
    @InjectModel(StaffCall.name)
    private readonly staffCallModel: Model<StaffCallDocument>,
  ) {}

  /**
   * Khách gọi nhân viên. Kiểm tra cooldown 30 giây / bàn.
   */
  async createCall(dto: CreateStaffCallDto): Promise<StaffCallDocument> {
    const tableKey = dto.tableId;
    const now = Date.now();
    const lastCall = this.cooldowns.get(tableKey);

    if (lastCall && now - lastCall < COOLDOWN_MS) {
      const remaining = Math.ceil((COOLDOWN_MS - (now - lastCall)) / 1000);
      throw new BadRequestException(
        `Vui lòng chờ ${remaining} giây trước khi gọi lại.`,
      );
    }

    // Ghi nhận cooldown
    this.cooldowns.set(tableKey, now);

    // Tạo bản ghi mới
    const newCall = new this.staffCallModel({
      tableId: dto.tableId,
      message: dto.message || '',
      status: 'pending',
    });

    const saved = await newCall.save();
    const populated = await this.staffCallModel
      .findById(saved._id)
      .populate('tableId')
      .exec();

    return populated ?? saved;
  }

  /**
   * Lấy danh sách các yêu cầu đang chờ (pending) để hiển thị trên Dashboard.
   */
  async findPending(): Promise<StaffCallDocument[]> {
    return this.staffCallModel
      .find({ status: 'pending' })
      .populate('tableId')
      .sort({ createdAt: -1 })
      .exec();
  }

  /**
   * Nhân viên xác nhận đã tiếp nhận yêu cầu.
   */
  async acknowledge(id: string): Promise<StaffCallDocument> {
    const updated = await this.staffCallModel
      .findByIdAndUpdate(
        id,
        {
          status: 'acknowledged',
          acknowledgedAt: new Date(),
        },
        { new: true },
      )
      .populate('tableId')
      .exec();

    if (!updated) {
      throw new NotFoundException(`Không tìm thấy yêu cầu gọi nhân viên: ${id}`);
    }

    return updated;
  }
}
