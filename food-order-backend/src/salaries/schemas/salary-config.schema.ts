import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SalaryConfigDocument = HydratedDocument<SalaryConfig>;

@Schema({ timestamps: true })
export class SalaryConfig {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: String, enum: ['monthly', 'hourly'], default: 'monthly' })
  type: string;

  @Prop({ type: Number, required: true, min: 0 })
  baseSalary: number; // VND/tháng nếu monthly; VND/giờ nếu hourly

  @Prop({ type: Number, default: 1.5 })
  overtimeRate: number; // Hệ số lương giờ thêm

  @Prop({ type: Number, default: 176 })
  standardHoursPerMonth: number; // Giờ chuẩn/tháng (22 ngày × 8h)

  @Prop({ type: Date, default: Date.now })
  effectiveFrom: Date;
}
export const SalaryConfigSchema = SchemaFactory.createForClass(SalaryConfig);
