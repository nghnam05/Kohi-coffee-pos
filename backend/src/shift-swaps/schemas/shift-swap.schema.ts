import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ShiftSwapRequestDocument = HydratedDocument<ShiftSwapRequest>;

@Schema({ timestamps: true })
export class ShiftSwapRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ type: String, required: true })
  currentShift: string; // 'morning' | 'afternoon' | 'evening'

  @Prop({ type: String, required: true })
  requestedShift: string; // 'morning' | 'afternoon' | 'evening'

  @Prop({ type: String, default: '' })
  reason: string;

  @Prop({ type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending', index: true })
  status: string;

  @Prop({ type: Types.ObjectId, ref: 'User', default: null })
  approvedBy: Types.ObjectId;
}

export const ShiftSwapRequestSchema = SchemaFactory.createForClass(ShiftSwapRequest);
