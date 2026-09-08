import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type IngredientUsageDocument = HydratedDocument<IngredientUsage>;

@Schema({ timestamps: true })
export class IngredientUsage {
  @Prop({ type: Types.ObjectId, ref: 'Ingredient', required: true, index: true })
  ingredientId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  ingredientName: string;

  @Prop({ type: String, default: 'kg' })
  unit: string;

  @Prop({ type: Number, required: true, min: 0 })
  quantity: number; // Số lượng giảm (lượng tiêu hao)

  @Prop({ type: Number, required: true, min: 0 })
  unitPrice: number; // Đơn giá tại thời điểm giảm

  @Prop({ type: Number, required: true, min: 0 })
  totalCost: number; // quantity * unitPrice (giá trị tiêu hao được cộng vào ngày đó)

  @Prop({ type: Date, required: true, default: Date.now, index: true })
  date: Date; // Thời điểm giảm

  @Prop({ type: String, default: 'Nhân viên' })
  updatedBy: string;

  @Prop({ type: String, default: 'Tiêu hao pha chế / xuất kho' })
  note: string;
}

export const IngredientUsageSchema = SchemaFactory.createForClass(IngredientUsage);
