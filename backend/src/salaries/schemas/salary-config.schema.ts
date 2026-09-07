import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SalaryConfigDocument = HydratedDocument<SalaryConfig>;
export type SalaryPayType = 'hourly' | 'daily' | 'weekly' | 'monthly';

@Schema({ timestamps: true })
export class SalaryConfig {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  // Hình thức tính lương chính: theo giờ, ngày (công nhật/ca), tuần, hoặc tháng
  @Prop({ type: String, enum: ['hourly', 'daily', 'weekly', 'monthly'], default: 'hourly' })
  type: SalaryPayType;

  // Đơn giá lương theo giờ (VND/h)
  @Prop({ type: Number, default: 25000, min: 0 })
  hourlyRate: number;

  // Đơn giá lương theo ngày chuẩn (VND/ngày)
  @Prop({ type: Number, default: 200000, min: 0 })
  dailyRate: number;

  // Đơn giá theo từng ca cụ thể: Sáng / Chiều / Tối
  @Prop({
    type: {
      morning: { type: Number, default: 120000 },
      afternoon: { type: Number, default: 120000 },
      evening: { type: Number, default: 150000 },
    },
    default: () => ({ morning: 120000, afternoon: 120000, evening: 150000 }),
  })
  shiftRates: {
    morning: number;
    afternoon: number;
    evening: number;
  };

  // Mức lương khoán theo tuần (nếu áp dụng)
  @Prop({ type: Number, default: 0, min: 0 })
  weeklyBaseRate: number;

  // Mức lương cố định tháng (cho nhân viên full-time)
  @Prop({ type: Number, default: 0, min: 0 })
  monthlyBaseSalary: number;

  // Tương thích ngược với trường baseSalary cũ
  @Prop({ type: Number, default: 25000, min: 0 })
  baseSalary: number;

  // Hệ số làm thêm giờ (OT)
  @Prop({ type: Number, default: 1.5, min: 1 })
  overtimeRate: number;

  // Định mức giờ làm chuẩn
  @Prop({ type: Number, default: 8 })
  standardHoursPerDay: number;

  @Prop({ type: Number, default: 44 })
  standardHoursPerWeek: number;

  @Prop({ type: Number, default: 176 })
  standardHoursPerMonth: number;

  // Phụ cấp ăn ca (VND / ca làm việc)
  @Prop({ type: Number, default: 0, min: 0 })
  mealAllowancePerShift: number;

  // Thưởng chuyên cần tuần (VND nếu đi đủ ca tuần)
  @Prop({ type: Number, default: 0, min: 0 })
  weeklyAttendanceBonus: number;

  @Prop({ type: Date, default: Date.now })
  effectiveFrom: Date;
}

export const SalaryConfigSchema = SchemaFactory.createForClass(SalaryConfig);
