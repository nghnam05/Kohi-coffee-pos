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

  @Prop({ type: Boolean, default: false })
  paymentNotified: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
