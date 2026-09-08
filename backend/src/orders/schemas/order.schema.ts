import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

// -------------------------------------------------------
// Sub-document Schema: Định nghĩa cấu trúc của từng item
// trong mảng items của một đơn hàng.
// -------------------------------------------------------
@Schema({ _id: false })
export class OrderItem {
  @Prop({
    type: Types.ObjectId,
    ref: 'Food',
    required: true,
  })
  foodId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
    min: 1,
  })
  quantity: number;

  @Prop({
    type: String,
  })
  note: string;

  @Prop({
    type: String,
    default: null,
  })
  orderedBy?: string;

  @Prop({
    type: String,
    default: null,
  })
  deviceId?: string;

  @Prop({
    type: Boolean,
    default: false,
  })
  isPaid?: boolean;

  @Prop({
    type: String,
    default: null,
  })
  paidBy?: string;

  @Prop({
    type: Date,
    default: null,
  })
  paidAt?: Date;
}

export const OrderItemSchema = SchemaFactory.createForClass(OrderItem);

// -------------------------------------------------------
// Main Schema: Order
// -------------------------------------------------------
@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'Table',
    required: false,
    default: null,
  })
  tableId: Types.ObjectId;

  @Prop({
    type: Boolean,
    default: false,
  })
  isTakeaway: boolean;

  @Prop({
    type: [OrderItemSchema],
    default: [],
  })
  items: OrderItem[];

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  totalAmount: number;

  @Prop({
    type: String,
    enum: ['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled', 'paid'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    enum: ['unpaid', 'paid'],
    default: 'unpaid',
  })
  paymentStatus: string;

  @Prop({ type: String, enum: ['cash', 'momo', 'bank_transfer', 'bank'], default: 'cash' })
  paymentMethod: string;

  @Prop({ type: String, default: null })
  couponCode: string;

  @Prop({ type: Number, default: 0 })
  discountAmount: number;

  @Prop({ type: String, default: null })
  customerName: string;

  @Prop({ type: String, default: null })
  customerPhone: string;

  @Prop({ type: Date, default: null })
  paidAt: Date;

  @Prop({ type: Number, default: 0, min: 0 })
  paidAmount: number;

  @Prop({
    type: [
      {
        transactionId: { type: String, default: null },
        payerName: { type: String, default: 'Khách' },
        deviceId: { type: String, default: null },
        amount: { type: Number, required: true },
        paymentMethod: { type: String, default: 'cash' },
        itemIndexes: { type: [Number], default: [] },
        paidAt: { type: Date, default: () => new Date() },
        status: { type: String, enum: ['pending', 'confirmed'], default: 'confirmed' },
      },
    ],
    default: [],
  })
  partialPayments: Array<{
    transactionId?: string;
    payerName: string;
    deviceId?: string;
    amount: number;
    paymentMethod: string;
    itemIndexes: number[];
    paidAt: Date;
    status: 'pending' | 'confirmed';
  }>;

  @Prop({ type: Boolean, default: false })
  paymentNotified: boolean;

  @Prop({ type: String, default: null })
  rewardedVoucherCode: string;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
