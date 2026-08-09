import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema.js';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
  ) {}

  /** Nhân viên bấm bắt đầu ca */
  async checkIn(userId: string): Promise<AttendanceDocument> {
    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Kiểm tra đã chấm công hôm nay chưa
    const existing = await this.attendanceModel.findOne({ userId, date: dateOnly }).exec();
    if (existing) {
      if (!existing.checkOut) throw new BadRequestException('Bạn đã bắt đầu ca làm việc hôm nay rồi.');
      throw new BadRequestException('Bạn đã kết thúc ca làm việc hôm nay rồi.');
    }

    const record = new this.attendanceModel({
      userId,
      date: dateOnly,
      checkIn: now,
    });
    return record.save();
  }

  /** Nhân viên bấm kết thúc ca */
  async checkOut(userId: string): Promise<AttendanceDocument> {
    const now = new Date();
    const dateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const record = await this.attendanceModel.findOne({ userId, date: dateOnly }).exec();
    if (!record) throw new NotFoundException('Bạn chưa bắt đầu ca làm việc hôm nay.');
    if (record.checkOut) throw new BadRequestException('Bạn đã kết thúc ca làm việc rồi.');

    record.checkOut = now;
    const diffSec = Math.max(0, Math.floor((now.getTime() - record.checkIn.getTime()) / 1000));
    record.totalHours = Number((diffSec / 3600).toFixed(4));
    return record.save();
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
  async adminEdit(id: string, checkIn: string, checkOut: string, note?: string): Promise<AttendanceDocument> {
    const record = await this.attendanceModel.findById(id).exec();
    if (!record) throw new NotFoundException('Không tìm thấy bản ghi chấm công.');
    record.checkIn = new Date(checkIn);
    record.checkOut = new Date(checkOut);
    const diffSec = Math.max(0, Math.floor((record.checkOut.getTime() - record.checkIn.getTime()) / 1000));
    record.totalHours = Number((diffSec / 3600).toFixed(4));
    record.note = note || record.note;
    record.isManualEdit = true;
    return record.save();
  }
}
