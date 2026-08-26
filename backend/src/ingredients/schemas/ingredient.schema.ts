import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IngredientDocument = Ingredient & Document;

@Schema({ timestamps: true })
export class Ingredient {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true, default: 'Cà phê & Đồ uống' })
  category: string;

  @Prop({ required: true, trim: true, default: 'kg' })
  unit: string;

  @Prop({ required: true, default: 0, min: 0 })
  currentQuantity: number;

  @Prop({ required: true, default: 2, min: 0 })
  minThreshold: number;

  @Prop({
    required: true,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
  })
  status: string;

  @Prop({ trim: true, default: 'Hệ thống' })
  lastUpdatedBy: string;
}

export const IngredientSchema = SchemaFactory.createForClass(Ingredient);
