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

  @Prop({ type: String, enum: ['pending', 'confirmed', 'arrived', 'cancelled'], default: 'pending', index: true })
  status: string;

  @Prop({ type: String, default: '', trim: true })
  note: string;
}

export const ReservationSchema = SchemaFactory.createForClass(Reservation);
