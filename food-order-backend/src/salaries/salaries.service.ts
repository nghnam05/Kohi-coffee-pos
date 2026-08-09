import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { SalaryConfig, SalaryConfigDocument } from './schemas/salary-config.schema.js';
import { Payroll, PayrollDocument } from './schemas/payroll.schema.js';
import { AttendanceService } from '../attendance/attendance.service.js';

@Injectable()
export class SalariesService {
  constructor(
    @InjectModel(SalaryConfig.name) private readonly configModel: Model<SalaryConfigDocument>,
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    private readonly attendanceService: AttendanceService,
  ) {}

  // ── Salary Config ────────────────────────────────────────────────────────────

  async getConfigs(): Promise<SalaryConfigDocument[]> {
    return this.configModel.find().populate('userId', 'name email role').exec();
  }

  async getConfigByUser(userId: string): Promise<SalaryConfigDocument | null> {
    return this.configModel.findOne({ userId }).populate('userId', 'name email role').exec();
  }

  async upsertConfig(userId: string, data: Partial<SalaryConfig>): Promise<SalaryConfigDocument> {
    const existing = await this.configModel.findOne({ userId }).exec();
    if (existing) {
      Object.assign(existing, data);
      return existing.save();
    }
    const config = new this.configModel({ userId, ...data });
    return config.save();
  }

  // ── Payroll ──────────────────────────────────────────────────────────────────

  /** Tạo / Cập nhật bảng lương tháng từ tổng giờ Chấm công */
  async generatePayroll(userId: string, month: number, year: number): Promise<PayrollDocument> {
    let config = await this.configModel.findOne({ userId }).exec();
    if (!config) {
      config = await this.configModel.create({
        userId,
        type: 'hourly',
        baseSalary: 30000,
        overtimeRate: 1.5,
        standardHoursPerMonth: 176,
      });
    }

    const summary = await this.attendanceService.getMonthlySummary(
      userId, String(month), String(year),
    );

    const totalHoursWorked = summary.totalHours;
    const standardHours = config.standardHoursPerMonth;
    const overtimeHours = Math.max(0, totalHoursWorked - standardHours);
    let baseSalary = 0;
    let overtimePay = 0;

    if (config.type === 'hourly') {
      // Lương theo giờ = Tổng số giờ chấm công * Đơn giá 1 tiếng
      baseSalary = Math.round(totalHoursWorked * config.baseSalary);
      overtimePay = 0;
    } else {
      // Lương cố định tháng + OT nếu có
      baseSalary = config.baseSalary;
      const hourlyRate = config.baseSalary / standardHours;
      overtimePay = Math.round(overtimeHours * hourlyRate * config.overtimeRate);
    }

    // Kiểm tra xem đã có bản ghi bảng lương tháng này chưa
    const existing = await this.payrollModel.findOne({ userId, month, year }).exec();
    if (existing) {
      existing.totalHoursWorked = totalHoursWorked;
      existing.baseSalary = baseSalary;
      existing.overtimePay = overtimePay;
      existing.netSalary = baseSalary + overtimePay + (existing.bonuses || 0) - (existing.deductions || 0);
      return (await existing.save()).populate('userId', 'name email role') as any;
    }

    const netSalary = baseSalary + overtimePay;
    const payroll = new this.payrollModel({
      userId,
      month,
      year,
      totalHoursWorked,
      standardHours,
      overtimeHours,
      baseSalary,
      overtimePay,
      bonuses: 0,
      deductions: 0,
      netSalary,
    });
    return (await payroll.save()).populate('userId', 'name email role') as any;
  }

  async findPayrolls(month?: number, year?: number): Promise<PayrollDocument[]> {
    const filter: any = {};
    if (month) filter.month = month;
    if (year) filter.year = year;
    return this.payrollModel
      .find(filter)
      .populate('userId', 'name email role')
      .sort({ year: -1, month: -1 })
      .exec();
  }

  async findMyPayrolls(userId: string, month?: number, year?: number): Promise<PayrollDocument[]> {
    const filter: any = { userId };
    if (month) filter.month = month;
    if (year) filter.year = year;
    return this.payrollModel.find(filter).sort({ year: -1, month: -1 }).exec();
  }

  async updatePayroll(id: string, data: {
    bonuses?: number; deductions?: number; note?: string;
  }): Promise<PayrollDocument> {
    const p = await this.payrollModel.findById(id).exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');
    if (data.bonuses !== undefined) p.bonuses = data.bonuses;
    if (data.deductions !== undefined) p.deductions = data.deductions;
    if (data.note !== undefined) p.note = data.note;
    p.netSalary = p.baseSalary + p.overtimePay + p.bonuses - p.deductions;
    return p.save();
  }

  async confirmPayroll(id: string): Promise<PayrollDocument> {
    const p = await this.payrollModel.findByIdAndUpdate(
      id, { status: 'confirmed' }, { new: true },
    ).populate('userId', 'name email role').exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');
    return p;
  }

  async markPaid(id: string, paidMethod: string): Promise<PayrollDocument> {
    const p = await this.payrollModel.findByIdAndUpdate(
      id,
      { status: 'paid', paidAt: new Date(), paidMethod },
      { new: true },
    ).populate('userId', 'name email role').exec();
    if (!p) throw new NotFoundException('Không tìm thấy bảng lương.');
    return p;
  }
}
