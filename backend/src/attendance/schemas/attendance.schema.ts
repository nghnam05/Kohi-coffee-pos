import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type AttendanceDocument = HydratedDocument<Attendance>;

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true, index: true })
  date: Date; // Chỉ lưu ngày (yyyy-mm-dd), không giờ

  @Prop({ type: Date, required: true })
  checkIn: Date;

  @Prop({ type: Date, default: null })
  checkOut: Date;

  @Prop({ type: String, default: 'morning' })
  shift: string; // 'morning' | 'afternoon' | 'evening'

  @Prop({ type: Number, default: 0 })
  totalHours: number; // Tính khi checkOut

  @Prop({ type: String, default: '' })
  note: string;

  @Prop({ type: Boolean, default: false })
  isManualEdit: boolean; // Admin chỉnh tay
}

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);
// Unique: mỗi nhân viên chỉ có 1 bản ghi checkIn/ngày
AttendanceSchema.index({ userId: 1, date: 1 }, { unique: true });
