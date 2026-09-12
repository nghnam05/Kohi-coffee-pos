import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReservationDocument = HydratedDocument<Reservation>;

@Schema({ timestamps: true })
export class Reservation {
  @Prop({ type: Types.ObjectId, ref: 'Table', required: true, index: true })
  tableId: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  customerName: string;

  @Prop({ type: String, required: true, trim: true })
  customerPhone: string;

  @Prop({ type: Number, required: true, min: 1, default: 2 })
  guestCount: number;

  @Prop({ type: Date, required: true, index: true })
  reservationTime: Date;

  @Prop({ type: String, enum: ['pending', 'confirmed', 'arrived', 'completed', 'cancelled'], default: 'pending', index: true })
  status: string;

  @Prop({ type: String, default: '', trim: true })
  note: string;

  @Prop({ type: Date })
  cancelledAt: Date;

  @Prop({ type: String, default: null, trim: true })
  checkInCode: string;

  @Prop({ type: Boolean, default: false })
  isCodeViewed: boolean;

  @Prop({ type: Boolean, default: false, index: true })
  isDeleted: boolean;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);

// 🚀 Performance Optimization Indexes:
// 1. Booking schedule and active slot availability queries
ReservationSchema.index({ reservationTime: 1, status: 1, isDeleted: 1 });

// 2. Table conflict detection
ReservationSchema.index({ tableId: 1, reservationTime: 1, status: 1 });

// 3. Customer reservation lookup by phone
ReservationSchema.index({ customerPhone: 1, status: 1 });
