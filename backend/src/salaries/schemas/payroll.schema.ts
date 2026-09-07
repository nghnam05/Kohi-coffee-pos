import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayrollDocument = HydratedDocument<Payroll>;
export type PayrollPeriodType = 'hourly' | 'daily' | 'weekly' | 'monthly';
export type PayrollStatus = 'draft' | 'confirmed' | 'paid';

@Schema({ timestamps: true })
export class Payroll {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  // Mã phiếu lương duy nhất (Ví dụ: PAY-W36-20260907-001)
  @Prop({ type: String, unique: true, sparse: true })
  payrollCode: string;

  // Loại chu kỳ tính lương: theo giờ, ngày/ca, tuần, tháng
  @Prop({ type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'monthly', index: true })
  periodType: PayrollPeriodType;

  // Khoảng thời gian tính lương
  @Prop({ type: Date, default: null, index: true })
  startDate: Date;

  @Prop({ type: Date, default: null, index: true })
  endDate: Date;

  // Tên hiển thị chu kỳ (Ví dụ: "Tuần (01/09 - 07/09/2026)", "Ngày 07/09/2026", "Tháng 09/2026")
  @Prop({ type: String, default: '' })
  periodLabel: string;

  // Tương thích ngược với các trường tháng / năm cũ
  @Prop({ type: Number, default: null })
  month?: number;

  @Prop({ type: Number, default: null })
  year?: number;

  // Danh sách ID các ca làm việc (Attendance) được chi trả trong phiếu này
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Attendance' }], default: [] })
  attendanceIds: Types.ObjectId[];

  // Tổng số giờ làm thực tế
  @Prop({ type: Number, default: 0 })
  totalHoursWorked: number;

  // Tổng số ca làm việc
  @Prop({ type: Number, default: 0 })
  totalShiftsWorked: number;

  // Giờ chuẩn tiêu chuẩn
  @Prop({ type: Number, default: 0 })
  standardHours: number;

  // Giờ làm thêm (OT)
  @Prop({ type: Number, default: 0 })
  overtimeHours: number;

  // Đơn giá áp dụng tại thời điểm tính
  @Prop({ type: Number, default: 0 })
  appliedRate: number;

  // Lương cơ bản theo định mức (giờ / ca / tuần / tháng)
  @Prop({ type: Number, required: true })
  baseSalary: number;

  // Tiền làm thêm giờ
  @Prop({ type: Number, default: 0 })
  overtimePay: number;

  // Phụ cấp (ăn ca, gửi xe...)
  @Prop({ type: Number, default: 0 })
  allowances: number;

  // Thưởng thêm (chuyên cần, doanh số...)
  @Prop({ type: Number, default: 0 })
  bonuses: number;

  // Khấu trừ / Tạm ứng / Phạt vi phạm
  @Prop({ type: Number, default: 0 })
  deductions: number;

  // Thực lĩnh = baseSalary + overtimePay + allowances + bonuses - deductions
  @Prop({ type: Number, required: true })
  netSalary: number;

  // Trạng thái phiếu lương
  @Prop({ type: String, enum: ['draft', 'confirmed', 'paid'], default: 'draft', index: true })
  status: PayrollStatus;

  // Thời điểm thanh toán
  @Prop({ type: Date, default: null })
  paidAt: Date;

  // Phương thức thanh toán: Tiền mặt, chuyển khoản ngân hàng, ví điện tử
  @Prop({ type: String, enum: ['cash', 'bank_transfer', 'momo'], default: 'cash' })
  paidMethod: string;

  // Mã tham chiếu thanh toán / mã giao dịch
  @Prop({ type: String, default: '' })
  paymentRef: string;

  // Ghi chú quản lý
  @Prop({ type: String, default: '' })
  note: string;
}

export const PayrollSchema = SchemaFactory.createForClass(Payroll);

// Đảm bảo không tạo 2 phiếu lương trùng lặp cho cùng 1 nhân viên trong cùng 1 khoảng thời gian
PayrollSchema.index({ userId: 1, periodType: 1, startDate: 1, endDate: 1 }, { unique: true, sparse: true });
// Index tối ưu truy vấn theo trạng thái và thời gian
PayrollSchema.index({ userId: 1, status: 1 });
PayrollSchema.index({ periodType: 1, status: 1 });
PayrollSchema.index({ createdAt: -1 });
