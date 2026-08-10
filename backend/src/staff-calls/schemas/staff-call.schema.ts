import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffCallDocument = HydratedDocument<StaffCall>;

@Schema({ timestamps: true })
export class StaffCall {
  @Prop({
    type: Types.ObjectId,
    ref: 'Table',
    required: true,
    index: true,
  })
  tableId: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['pending', 'acknowledged'],
    default: 'pending',
    index: true,
  })
  status: string;

  @Prop({
    type: String,
    maxlength: 200,
    default: '',
  })
  message: string;

  @Prop({
    type: Date,
    default: null,
  })
  acknowledgedAt: Date;
}

export const StaffCallSchema = SchemaFactory.createForClass(StaffCall);
