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
    required: true,
  })
  tableId: Types.ObjectId;

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
    enum: ['pending', 'confirmed', 'cooking', 'completed', 'cancelled', 'paid'],
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

  @Prop({
    type: String,
    enum: ['cash', 'momo'],
    default: 'cash',
  })
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
