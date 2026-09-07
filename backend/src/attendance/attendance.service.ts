import {
  Injectable, NotFoundException, BadRequestException, ConflictException, Optional,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Attendance, AttendanceDocument } from './schemas/attendance.schema.js';
import { User, UserDocument } from '../users/schemas/user.schema.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

import { getVietnamTime } from '../common/time.util.js';

@Injectable()
export class AttendanceService {
  constructor(
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @Optional() @InjectModel(User.name) private readonly userModel?: Model<UserDocument>,
    private readonly ordersGateway?: OrdersGateway,
  ) {}

  /** Nhân viên bấm bắt đầu ca */
  async checkIn(userId: string, requestedShift?: string): Promise<AttendanceDocument> {
    if (!userId || userId === 'null' || userId === 'undefined' || !isValidObjectId(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    const now = new Date();
    const vnTime = getVietnamTime(now);
    const startOfDay = vnTime.startOfDay;
    const endOfDay = vnTime.endOfDay;
    const dateOnly = startOfDay;

    // ⚡ Auto calculate shift based on current actual time (theo giờ Việt Nam UTC+7)
    let currentActualShift = 'morning';
    const hour = vnTime.hour;
    const minute = vnTime.minute;
    const totalMinutes = vnTime.totalMinutes;

    // Ca Sáng: 06:00 - 12:00 (mở check-in từ 05:45 đến 12:00)
    // Ca Chiều: 12:00 - 18:00 (mở check-in từ 11:45 đến 18:00)
    // Ca Tối: 18:00 - 23:00 (mở check-in từ 17:45 đến 23:00)
    if (totalMinutes >= 345 && totalMinutes < 720) {
      currentActualShift = 'morning';
    } else if (totalMinutes >= 705 && totalMinutes < 1080) {
      currentActualShift = 'afternoon';
    } else if (totalMinutes >= 1065 && totalMinutes <= 1380) {
      currentActualShift = 'evening';
    } else {
      currentActualShift = 'outside';
    }

    // ⚡ Kiểm tra ca được phân công (assignedShift) của nhân viên trong CSDL
    if (this.userModel) {
      const user = await this.userModel.findById(userId).lean().exec();
      if (user && user.assignedShift) {
        const assigned = user.assignedShift;
        const shiftLabels: Record<string, string> = {
          morning: 'Ca Sáng (06:00 - 12:00)',
          afternoon: 'Ca Chiều (12:00 - 18:00)',
          evening: 'Ca Tối (18:00 - 23:00)',
        };
        if (currentActualShift === 'outside' || assigned !== currentActualShift) {
          const currentTimeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
          throw new BadRequestException(
            `Bạn được phân công ${shiftLabels[assigned] || assigned}. Hiện tại là ${currentTimeStr}, không nằm trong khung giờ ca làm việc của bạn nên hệ thống khóa tính năng điểm danh.`,
          );
        }
      }
    }

    const shift = requestedShift && ['morning', 'afternoon', 'evening'].includes(requestedShift)
      ? requestedShift
      : currentActualShift;

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
    if (!userId || userId === 'null' || userId === 'undefined' || !isValidObjectId(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    const now = new Date();
    const vnTime = getVietnamTime(now);
    const startOfDay = vnTime.startOfDay;
    const endOfDay = vnTime.endOfDay;

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
    if (userId && userId !== 'null' && userId !== 'undefined' && isValidObjectId(userId)) {
      filter.userId = userId;
    }
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
  async adminEdit(id: string, checkIn?: string, checkOut?: string, note?: string, shift?: string, isPaid?: boolean): Promise<AttendanceDocument> {
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
    if (isPaid !== undefined) {
      record.isPaid = isPaid;
      if (isPaid) record.paidAt = new Date();
    }
    record.isManualEdit = true;
    return record.save();
  }

  /** Admin đánh dấu thanh toán lương hàng loạt ca */
  async markPaidBulk(ids: string[]): Promise<{ modifiedCount: number }> {
    if (!ids || ids.length === 0) return { modifiedCount: 0 };
    const validIds = ids.filter((id) => isValidObjectId(id));
    const res = await this.attendanceModel.updateMany(
      { _id: { $in: validIds } },
      { $set: { isPaid: true, paidAt: new Date() } },
    ).exec();
    return { modifiedCount: res.modifiedCount };
  }

  /** Admin xóa bản ghi chấm công */
  async deleteAttendance(id: string): Promise<AttendanceDocument> {
    const record = await this.attendanceModel.findByIdAndDelete(id).exec();
    if (!record) throw new NotFoundException('Không tìm thấy bản ghi chấm công.');
    return record;
  }
}
