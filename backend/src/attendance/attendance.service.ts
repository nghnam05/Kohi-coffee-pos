import {
  Injectable, NotFoundException, BadRequestException, ConflictException, Optional, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @Optional() @Inject(OrdersGateway) private readonly ordersGateway?: OrdersGateway,
  ) {}

  /** Nhân viên bấm bắt đầu ca */
  async checkIn(userId: string, requestedShift?: string): Promise<AttendanceDocument> {
    const now = new Date();
    // Use local date parts to build timezone-safe range (avoids UTC midnight boundary issues)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const dateOnly = startOfDay;

    // Auto calculate shift if not provided or invalid
    let shift = 'morning';
    if (requestedShift && ['morning', 'afternoon', 'evening'].includes(requestedShift)) {
      shift = requestedShift;
    } else {
      const hour = now.getHours();
      if (hour >= 5 && hour < 12) {
        shift = 'morning';
      } else if (hour >= 12 && hour < 18) {
        shift = 'afternoon';
      } else {
        shift = 'evening';
      }
    }

    // Kiểm tra đã chấm công hôm nay chưa – dùng range query để tránh lỗi timezone
    const existing = await this.attendanceModel.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
    if (existing) {
      if (!existing.checkOut) throw new BadRequestException('Bạn đã bắt đầu ca làm việc hôm nay rồi.');
      throw new BadRequestException('Bạn đã kết thúc ca làm việc hôm nay rồi.');
    }

    const record = new this.attendanceModel({
      userId,
      date: dateOnly,
      checkIn: now,
      shift,
    });
    const saved = await record.save();
    const populated = await this.attendanceModel.findById(saved._id).populate('userId', 'name email role').exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.emitAttendanceUpdate({
        type: 'check-in',
        attendance: populated,
        userId: (populated.userId as any)?._id?.toString() || userId.toString(),
        userName: (populated.userId as any)?.name || 'Nhân viên',
        userRole: (populated.userId as any)?.role || 'staff',
        userEmail: (populated.userId as any)?.email || '',
        shift: populated.shift || shift,
        timestamp: now,
      });
    }

    return populated || saved;
  }

  /** Nhân viên bấm kết thúc ca */
  async checkOut(userId: string): Promise<AttendanceDocument> {
    const now = new Date();
    // Use timezone-safe range query (same as checkIn)
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const record = await this.attendanceModel.findOne({
      userId,
      date: { $gte: startOfDay, $lte: endOfDay },
    }).exec();
    if (!record) throw new NotFoundException('Bạn chưa bắt đầu ca làm việc hôm nay.');
    if (record.checkOut) throw new BadRequestException('Bạn đã kết thúc ca làm việc rồi.');

    record.checkOut = now;
    const diffSec = Math.max(0, Math.floor((now.getTime() - record.checkIn.getTime()) / 1000));
    record.totalHours = Number((diffSec / 3600).toFixed(4));
    const saved = await record.save();
    const populated = await this.attendanceModel.findById(saved._id).populate('userId', 'name email role').exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.emitAttendanceUpdate({
        type: 'check-out',
        attendance: populated,
        userId: (populated.userId as any)?._id?.toString() || userId.toString(),
        userName: (populated.userId as any)?.name || 'Nhân viên',
        userRole: (populated.userId as any)?.role || 'staff',
        userEmail: (populated.userId as any)?.email || '',
        shift: populated.shift || 'morning',
        timestamp: now,
      });
    }

    return populated || saved;
  }

  /** Admin: lấy danh sách chấm công với filter */
  async findAll(userId?: string, month?: string, year?: string): Promise<AttendanceDocument[]> {
    const filter: any = {};
    if (userId) filter.userId = userId;
    if (month && year) {
      const m = parseInt(month) - 1;
      const y = parseInt(year);
      filter.date = { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) };
    }
    return this.attendanceModel
      .find(filter)
      .populate('userId', 'name email role')
      .sort({ date: -1, checkIn: -1 })
      .exec();
  }

  /** Nhân viên xem lịch của mình */
  async findMyAttendance(userId: string, month?: string, year?: string): Promise<AttendanceDocument[]> {
    return this.findAll(userId, month, year);
  }

  /** Tổng giờ làm trong tháng */
  async getMonthlySummary(userId: string, month: string, year: string): Promise<{
    userId: string; totalHours: number; workingDays: number;
  }> {
    const m = parseInt(month) - 1;
    const y = parseInt(year);
    const records = await this.attendanceModel.find({
      userId,
      date: { $gte: new Date(y, m, 1), $lt: new Date(y, m + 1, 1) },
      checkOut: { $ne: null },
    }).lean().exec();

    const totalHours = records.reduce((sum, r) => {
      let h = r.totalHours || 0;
      if (!h && r.checkIn && r.checkOut) {
        const sec = Math.floor((new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / 1000);
        h = sec / 3600;
      }
      return sum + h;
    }, 0);
    return { userId, totalHours: Number(totalHours.toFixed(4)), workingDays: records.length };
  }

  /** Admin chỉnh sửa thủ công */
  async adminEdit(id: string, checkIn?: string, checkOut?: string, note?: string, shift?: string): Promise<AttendanceDocument> {
    const record = await this.attendanceModel.findById(id).exec();
    if (!record) throw new NotFoundException('Không tìm thấy bản ghi chấm công.');

    if (checkIn) {
      const cIn = new Date(checkIn);
      if (!isNaN(cIn.getTime())) {
        record.checkIn = cIn;
      }
    }

    if (checkOut) {
      const cOut = new Date(checkOut);
      if (!isNaN(cOut.getTime())) {
        record.checkOut = cOut;
      }
    }

    if (shift && ['morning', 'afternoon', 'evening'].includes(shift)) {
      record.shift = shift;
    }

    if (record.checkIn && record.checkOut) {
      const diffSec = Math.max(0, Math.floor((record.checkOut.getTime() - record.checkIn.getTime()) / 1000));
      record.totalHours = Number((diffSec / 3600).toFixed(4));
    }

    if (note !== undefined) {
      record.note = note;
    }
    record.isManualEdit = true;
    return record.save();
  }

  /** Admin xóa bản ghi chấm công */
  async deleteAttendance(id: string): Promise<AttendanceDocument> {
    const record = await this.attendanceModel.findByIdAndDelete(id).exec();
    if (!record) throw new NotFoundException('Không tìm thấy bản ghi chấm công.');
    return record;
  }
}
