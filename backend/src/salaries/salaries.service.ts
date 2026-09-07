import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId, Types } from 'mongoose';
import { SalaryConfig, SalaryConfigDocument, SalaryPayType } from './schemas/salary-config.schema.js';
import { Payroll, PayrollDocument, PayrollPeriodType } from './schemas/payroll.schema.js';
import { AttendanceService } from '../attendance/attendance.service.js';
import { getVietnamTime } from '../common/time.util.js';

export interface CalculatePeriodParams {
  userId: string;
  periodType?: PayrollPeriodType;
  startDate?: string | Date;
  endDate?: string | Date;
  date?: string | Date;
  month?: number;
  year?: number;
}

@Injectable()
export class SalariesService {
  constructor(
    @InjectModel(SalaryConfig.name) private readonly configModel: Model<SalaryConfigDocument>,
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ── Salary Config ────────────────────────────────────────────────────────────

  async getConfigs(): Promise<SalaryConfigDocument[]> {
    return this.configModel.find().populate('userId', 'name email role assignedShift').exec();
  }

  async getConfigByUser(userId: string): Promise<SalaryConfigDocument> {
    if (!userId || userId === 'null' || userId === 'undefined' || !isValidObjectId(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    let config = await this.configModel.findOne({ userId }).populate('userId', 'name email role assignedShift').exec();
    if (!config) {
      config = await this.configModel.create({
        userId,
        type: 'hourly',
        hourlyRate: 25000,
        dailyRate: 200000,
        shiftRates: { morning: 120000, afternoon: 120000, evening: 150000 },
        weeklyBaseRate: 0,
        monthlyBaseSalary: 0,
        baseSalary: 25000,
        overtimeRate: 1.5,
        standardHoursPerDay: 8,
        standardHoursPerWeek: 44,
        standardHoursPerMonth: 176,
        mealAllowancePerShift: 0,
        weeklyAttendanceBonus: 0,
      });
      config = await this.configModel.findById(config._id).populate('userId', 'name email role assignedShift').exec();
    }
    return config!;
  }

  async upsertConfig(userId: string, data: Partial<SalaryConfig>): Promise<SalaryConfigDocument> {
    if (!userId || userId === 'null' || userId === 'undefined' || !isValidObjectId(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }
    const existing = await this.configModel.findOne({ userId }).exec();
    if (existing) {
      Object.assign(existing, data);
      if (data.hourlyRate !== undefined && !data.baseSalary) {
        existing.baseSalary = data.hourlyRate;
      }
      return (await existing.save()).populate('userId', 'name email role assignedShift') as any;
    }
    const config = new this.configModel({ userId, ...data });
    if (data.hourlyRate && !data.baseSalary) {
      config.baseSalary = data.hourlyRate;
    }
    return (await config.save()).populate('userId', 'name email role assignedShift') as any;
  }

  // ── Helpers For Calculation ──────────────────────────────────────────────────

  private resolvePeriodDates(params: CalculatePeriodParams): {
    periodType: PayrollPeriodType;
    start: Date;
    end: Date;
    label: string;
    monthNum: number;
    yearNum: number;
  } {
    const periodType = params.periodType || 'weekly';
    const now = new Date();
    const vnNow = getVietnamTime(now);

    const pad = (n: number) => String(n).padStart(2, '0');

    if (periodType === 'daily') {
      const targetDate = params.date ? new Date(params.date) : now;
      const vnTarget = getVietnamTime(targetDate);
      const start = vnTarget.startOfDay;
      const end = vnTarget.endOfDay;
      const label = `Ngày ${pad(targetDate.getDate())}/${pad(targetDate.getMonth() + 1)}/${targetDate.getFullYear()}`;
      return {
        periodType: 'daily',
        start,
        end,
        label,
        monthNum: targetDate.getMonth() + 1,
        yearNum: targetDate.getFullYear(),
      };
    }

    if (periodType === 'weekly') {
      let start: Date;
      let end: Date;

      if (params.startDate && params.endDate) {
        start = new Date(params.startDate);
        end = new Date(params.endDate);
      } else {
        const refDate = params.date ? new Date(params.date) : now;
        const day = refDate.getDay();
        const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(refDate.setDate(diff));
        start.setHours(0, 0, 0, 0);

        end = new Date(start);
        end.setDate(start.getDate() + 6);
        end.setHours(23, 59, 59, 999);
      }

      const label = `Tuần (${pad(start.getDate())}/${pad(start.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${start.getFullYear()})`;
      return {
        periodType: 'weekly',
        start,
        end,
        label,
        monthNum: start.getMonth() + 1,
        yearNum: start.getFullYear(),
      };
    }

    if (periodType === 'hourly') {
      let start = params.startDate ? new Date(params.startDate) : new Date(now.getTime() - 30 * 24 * 3600 * 1000);
      let end = params.endDate ? new Date(params.endDate) : now;
      const label = `Kỳ Theo Giờ (${pad(start.getDate())}/${pad(start.getMonth() + 1)} - ${pad(end.getDate())}/${pad(end.getMonth() + 1)}/${end.getFullYear()})`;
      return {
        periodType: 'hourly',
        start,
        end,
        label,
        monthNum: end.getMonth() + 1,
        yearNum: end.getFullYear(),
      };
    }

    // Monthly
    const monthNum = params.month ? Number(params.month) : vnNow.month;
    const yearNum = params.year ? Number(params.year) : vnNow.year;
    const start = new Date(yearNum, monthNum - 1, 1, 0, 0, 0, 0);
    const end = new Date(yearNum, monthNum, 0, 23, 59, 59, 999);
    const label = `Tháng ${pad(monthNum)}/${yearNum}`;
    return {
      periodType: 'monthly',
      start,
      end,
      label,
      monthNum,
      yearNum,
    };
  }

  // ── Multi-Cycle Payroll Calculation (Preview & Generate) ─────────────────────

  /** Tính toán xem trước bảng lương theo kỳ (theo giờ, ngày/ca, tuần, tháng) */
  async calculatePeriodPreview(params: CalculatePeriodParams) {
    const { userId } = params;
    if (!userId || !isValidObjectId(userId)) {
      throw new BadRequestException('ID người dùng không hợp lệ.');
    }

    const config = await this.getConfigByUser(userId);
    const { periodType, start, end, label, monthNum, yearNum } = this.resolvePeriodDates(params);

    // Lấy danh sách chấm công chưa thanh toán trong khoảng thời gian này
    const attendances = await this.attendanceService.getAttendanceByRange(userId, start, end, true);

    let totalHoursWorked = 0;
    let totalShiftsWorked = attendances.length;
    let baseSalary = 0;
    let overtimeHours = 0;
    let overtimePay = 0;
    let allowances = 0;
    let bonuses = 0;
    let deductions = 0;

    // Chi tiết từng ca làm việc để đưa vào preview
    const shiftDetails = attendances.map((att) => {
      let hours = att.totalHours || 0;
      if (!hours && att.checkIn && att.checkOut) {
        const sec = Math.floor((new Date(att.checkOut).getTime() - new Date(att.checkIn).getTime()) / 1000);
        hours = Number((sec / 3600).toFixed(2));
      }
      totalHoursWorked += hours;

      let shiftEarnings = 0;
      const shiftType = att.shift || 'morning';

      // 1. Tính theo Ngày / Theo Ca (Daily)
      if (periodType === 'daily' || config.type === 'daily') {
        const rateForShift = (config.shiftRates as any)?.[shiftType] || config.dailyRate || 120000;
        // Chuẩn ca: 6 tiếng cho morning/afternoon, 5 tiếng cho evening
        const standardShiftHours = shiftType === 'evening' ? 5 : 6;
        if (hours >= standardShiftHours * 0.9) {
          shiftEarnings = rateForShift; // 1 công đủ
        } else if (hours >= standardShiftHours * 0.45) {
          shiftEarnings = Math.round(rateForShift * 0.5); // 0.5 công
        } else {
          // Dưới 45% thời lượng ca: tính theo giờ thực tế
          const hourlyRate = Math.round(rateForShift / standardShiftHours);
          shiftEarnings = Math.round(hours * hourlyRate);
        }
      } else {
        // 2. Mặc định tính theo Giờ (Hourly)
        const hourlyRate = config.hourlyRate || config.baseSalary || 25000;
        shiftEarnings = Math.round(hours * hourlyRate);
      }

      return {
        _id: att._id,
        date: att.date,
        checkIn: att.checkIn,
        checkOut: att.checkOut,
        shift: shiftType,
        hours: Number(hours.toFixed(2)),
        shiftEarnings,
        note: att.note || '',
      };
    });

    totalHoursWorked = Number(totalHoursWorked.toFixed(2));

    // Tổng hợp thu nhập dựa theo hình thức tính
    if (periodType === 'daily' || config.type === 'daily') {
      baseSalary = shiftDetails.reduce((sum, s) => sum + s.shiftEarnings, 0);
      // Phụ cấp ăn ca nếu có
      if (config.mealAllowancePerShift > 0) {
        allowances += totalShiftsWorked * config.mealAllowancePerShift;
      }
    } else if (periodType === 'weekly') {
      if (config.weeklyBaseRate > 0) {
        // Lương khoán tuần cố định
        baseSalary = config.weeklyBaseRate;
      } else if ((config.type as string) === 'daily') {
        baseSalary = shiftDetails.reduce((sum, s) => sum + s.shiftEarnings, 0);
      } else {
        // Lương theo giờ tuần
        const hourlyRate = config.hourlyRate || config.baseSalary || 25000;
        baseSalary = Math.round(totalHoursWorked * hourlyRate);
      }
      // Phụ cấp ăn ca
      if (config.mealAllowancePerShift > 0) {
        allowances += totalShiftsWorked * config.mealAllowancePerShift;
      }
      // Thưởng chuyên cần tuần nếu làm đủ ca (ví dụ >= 6 ca/tuần)
      if (totalShiftsWorked >= 6 && config.weeklyAttendanceBonus > 0) {
        bonuses += config.weeklyAttendanceBonus;
      }
    } else if (periodType === 'hourly') {
      const hourlyRate = config.hourlyRate || config.baseSalary || 25000;
      baseSalary = Math.round(totalHoursWorked * hourlyRate);
    } else {
      // Monthly
      const standardHours = config.standardHoursPerMonth || 176;
      if (config.type === 'hourly') {
        const hourlyRate = config.hourlyRate || config.baseSalary || 25000;
        baseSalary = Math.round(totalHoursWorked * hourlyRate);
      } else {
        const monthlyBase = config.monthlyBaseSalary || config.baseSalary || 0;
        const hourlyRate = standardHours > 0 ? monthlyBase / standardHours : 0;
        if (totalHoursWorked < standardHours) {
          baseSalary = Math.round(totalHoursWorked * hourlyRate);
        } else {
          baseSalary = monthlyBase;
          overtimeHours = Number((totalHoursWorked - standardHours).toFixed(2));
          overtimePay = Math.round(overtimeHours * hourlyRate * (config.overtimeRate || 1.5));
        }
      }
    }

    const netSalary = Math.max(0, baseSalary + overtimePay + allowances + bonuses - deductions);
    const appliedRate =
      periodType === 'daily'
        ? config.dailyRate || 200000
        : periodType === 'weekly' && config.weeklyBaseRate > 0
        ? config.weeklyBaseRate
        : config.hourlyRate || config.baseSalary || 25000;

    const payrollCode = `PAY-${periodType[0].toUpperCase()}${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;

    return {
      userId,
      payrollCode,
      periodType,
      startDate: start,
      endDate: end,
      periodLabel: label,
      month: monthNum,
      year: yearNum,
      totalHoursWorked,
      totalShiftsWorked,
      overtimeHours,
      appliedRate,
      baseSalary,
      overtimePay,
      allowances,
      bonuses,
      deductions,
      netSalary,
      attendanceIds: attendances.map((a) => a._id),
      shiftDetails,
      config,
    };
  }

  /** Tạo hoặc cập nhật bảng lương đa chu kỳ chính thức */
  async generatePeriodPayroll(params: CalculatePeriodParams & {
    bonuses?: number;
    deductions?: number;
    note?: string;
  }): Promise<PayrollDocument> {
    const preview = await this.calculatePeriodPreview(params);

    const bonuses = params.bonuses !== undefined ? params.bonuses : preview.bonuses;
    const deductions = params.deductions !== undefined ? params.deductions : preview.deductions;
    const netSalary = Math.max(0, preview.baseSalary + preview.overtimePay + preview.allowances + bonuses - deductions);

    // Kiểm tra xem đã có bản ghi kỳ này chưa (tránh duplicate)
    const existing = await this.payrollModel.findOne({
      userId: preview.userId,
      periodType: preview.periodType,
      startDate: preview.startDate,
      endDate: preview.endDate,
    }).exec();

    if (existing) {
      existing.totalHoursWorked = preview.totalHoursWorked;
      existing.totalShiftsWorked = preview.totalShiftsWorked;
      existing.overtimeHours = preview.overtimeHours;
      existing.appliedRate = preview.appliedRate;
      existing.baseSalary = preview.baseSalary;
      existing.overtimePay = preview.overtimePay;
      existing.allowances = preview.allowances;
      existing.bonuses = bonuses;
      existing.deductions = deductions;
      existing.netSalary = netSalary;
      existing.attendanceIds = preview.attendanceIds as any;
      if (params.note !== undefined) existing.note = params.note;
      return (await existing.save()).populate('userId', 'name email role assignedShift') as any;
    }

    const payroll = new this.payrollModel({
      userId: preview.userId,
      payrollCode: preview.payrollCode,
      periodType: preview.periodType,
      startDate: preview.startDate,
      endDate: preview.endDate,
      periodLabel: preview.periodLabel,
      month: preview.month,
      year: preview.year,
      attendanceIds: preview.attendanceIds,
      totalHoursWorked: preview.totalHoursWorked,
      totalShiftsWorked: preview.totalShiftsWorked,
      overtimeHours: preview.overtimeHours,
      appliedRate: preview.appliedRate,
      baseSalary: preview.baseSalary,
      overtimePay: preview.overtimePay,
      allowances: preview.allowances,
      bonuses,
      deductions,
      netSalary,
      status: 'confirmed',
      note: params.note || '',
    });

    return (await payroll.save()).populate('userId', 'name email role assignedShift') as any;
  }

  /** Tương thích ngược: tạo / cập nhật bảng lương tháng */
  async generatePayroll(userId: string, month: number, year: number): Promise<PayrollDocument> {
    return this.generatePeriodPayroll({
      userId,
      periodType: 'monthly',
      month,
      year,
    });
  }

  // ── Find & Queries ───────────────────────────────────────────────────────────

  async findPayrolls(filterParams?: {
    periodType?: string;
    month?: number;
    year?: number;
    status?: string;
    userId?: string;
  }): Promise<PayrollDocument[]> {
    const filter: any = {};
    if (filterParams?.userId && isValidObjectId(filterParams.userId)) {
      filter.userId = filterParams.userId;
    }
    if (filterParams?.periodType && filterParams.periodType !== 'all') {
      filter.periodType = filterParams.periodType;
    }
    if (filterParams?.status && filterParams.status !== 'all') {
      filter.status = filterParams.status;
    }
    if (filterParams?.month) filter.month = filterParams.month;
    if (filterParams?.year) filter.year = filterParams.year;

    return this.payrollModel
      .find(filter)
      .populate('userId', 'name email role assignedShift')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findMyPayrolls(userId: string, month?: number, year?: number): Promise<PayrollDocument[]> {
    if (!userId || userId === 'null' || userId === 'undefined' || !isValidObjectId(userId)) {
      return [];
    }
    const filter: any = { userId };
    if (month) filter.month = month;
    if (year) filter.year = year;
    return this.payrollModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async getPayrollById(id: string): Promise<PayrollDocument> {
    const p = await this.payrollModel
      .findById(id)
      .populate('userId', 'name email role assignedShift')
      .populate('attendanceIds')
      .exec();
    if (!p) throw new NotFoundException('Không tìm thấy phiếu lương.');
    return p;
  }

  async updatePayroll(id: string, data: {
    bonuses?: number; deductions?: number; note?: string;
  }): Promise<PayrollDocument> {
    const p = await this.payrollModel.findById(id).exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');
    if (data.bonuses !== undefined) p.bonuses = data.bonuses;
    if (data.deductions !== undefined) p.deductions = data.deductions;
    if (data.note !== undefined) p.note = data.note;
    p.netSalary = Math.max(0, p.baseSalary + (p.overtimePay || 0) + (p.allowances || 0) + p.bonuses - p.deductions);
    return (await p.save()).populate('userId', 'name email role assignedShift') as any;
  }

  async confirmPayroll(id: string): Promise<PayrollDocument> {
    const p = await this.payrollModel.findByIdAndUpdate(
      id, { status: 'confirmed' }, { new: true },
    ).populate('userId', 'name email role assignedShift').exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');
    return p;
  }

  /** Thanh toán phiếu lương & KHÓA CHỐNG TRẢ TRÙNG LẶP CHO CÁC CA LIÊN KẾT */
  async markPaid(id: string, paidMethod: string, paymentRef?: string): Promise<PayrollDocument> {
    const p = await this.payrollModel.findById(id).exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');

    p.status = 'paid';
    p.paidAt = new Date();
    p.paidMethod = paidMethod || 'cash';
    if (paymentRef) p.paymentRef = paymentRef;
    await p.save();

    // ⚡ Khóa chống trả trùng lặp: Đánh dấu tất cả các bản ghi chấm công liên kết là đã thanh toán
    if (p.attendanceIds && p.attendanceIds.length > 0 && typeof this.attendanceService.markPaidForPayroll === 'function') {
      await this.attendanceService.markPaidForPayroll(p.attendanceIds, p._id);
    }

    if (typeof p.populate === 'function') {
      return p.populate('userId', 'name email role assignedShift');
    }
    return p;
  }
}
