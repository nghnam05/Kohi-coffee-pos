import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type PayrollDocument = HydratedDocument<Payroll>;

@Schema({ timestamps: true })
export class Payroll {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  month: number;

  @Prop({ type: Number, required: true })
  year: number;

  @Prop({ type: Number, default: 0 })
  totalHoursWorked: number;

  @Prop({ type: Number, default: 176 })
  standardHours: number;

  @Prop({ type: Number, default: 0 })
  overtimeHours: number;

  @Prop({ type: Number, required: true })
  baseSalary: number; // Snapshot tại thời điểm tính

  @Prop({ type: Number, default: 0 })
  overtimePay: number;

  @Prop({ type: Number, default: 0 })
  bonuses: number;

  @Prop({ type: Number, default: 0 })
  deductions: number;

  @Prop({ type: Number, required: true })
  netSalary: number;

  @Prop({ type: String, enum: ['draft', 'confirmed', 'paid'], default: 'draft' })
  status: string;

  @Prop({ type: Date, default: null })
  paidAt: Date;

  @Prop({ type: String, enum: ['cash', 'bank_transfer'], default: 'cash' })
  paidMethod: string;

  @Prop({ type: String, default: '' })
  note: string;
}
export const PayrollSchema = SchemaFactory.createForClass(Payroll);
// Unique: mỗi nhân viên chỉ có 1 payroll/tháng
PayrollSchema.index({ userId: 1, month: 1, year: 1 }, { unique: true });
