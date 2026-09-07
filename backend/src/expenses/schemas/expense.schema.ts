import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ExpenseDocument = HydratedDocument<Expense>;

@Schema({ timestamps: true })
export class Expense {
  @Prop({ type: String, required: true, trim: true })
  title: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: Date, required: true, default: Date.now })
  date: Date;

  @Prop({ type: String, default: 'Vật tư & Tiện ích' })
  category: string; // 'Vật tư & Tiện ích' | 'Đá & Đồ uống phụ' | 'Sửa chữa & Bảo trì' | 'Khác'

  @Prop({ type: String, default: '' })
  note: string;

  @Prop({ type: String, default: 'Admin' })
  createdBy: string;
}

export const ExpenseSchema = SchemaFactory.createForClass(Expense);
ExpenseSchema.index({ date: 1 });
