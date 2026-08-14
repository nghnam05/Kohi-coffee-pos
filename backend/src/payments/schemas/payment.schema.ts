import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PaymentDocument = Payment & Document;

@Schema({ timestamps: true })
export class Payment {
  @Prop({ required: true, unique: true, index: true })
  invoiceCode: string; // ví dụ: HD-892147

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Order', required: true })
  orderId: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Table' })
  tableId?: string;

  @Prop({ required: true })
  tableName: string;

  @Prop()
  customerName?: string;

  @Prop({
    type: [
      {
        foodId: { type: MongooseSchema.Types.ObjectId, ref: 'Food' },
        foodName: { type: String, required: true },
        price: { type: Number, required: true },
        quantity: { type: Number, required: true },
        total: { type: Number, required: true },
        note: { type: String, default: '' },
      },
    ],
    default: [],
  })
  items: Array<{
    foodId?: string;
    foodName: string;
    price: number;
    quantity: number;
    total: number;
    note?: string;
  }>;

  @Prop({ required: true, default: 0 })
  subtotal: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ default: null })
  couponCode?: string;

  @Prop({ required: true, default: 0 })
  totalAmount: number;

  @Prop({ required: true, default: 'cash' })
  paymentMethod: string; // 'cash' | 'momo' | 'bank'

  @Prop({ default: null })
  transactionCode?: string;

  @Prop({ default: 'Nhân viên thu ngân' })
  staffName?: string;

  @Prop({ default: Date.now })
  paidAt: Date;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);
