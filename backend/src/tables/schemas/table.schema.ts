import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type TableDocument = HydratedDocument<Table>;

@Schema({ timestamps: true })
export class Table {
  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  tableName: string;

  @Prop({
    type: String,
  })
  qrCodeUrl: string;

  @Prop({
    type: String,
    default: () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36),
  })
  qrToken: string;

  @Prop({
    type: String,
    enum: ['empty', 'serving', 'reserved'],
    default: 'empty',
  })
  status: string;

  @Prop({
    type: Date,
    default: () => new Date(),
  })
  currentSessionStartedAt: Date;
}

export const TableSchema = SchemaFactory.createForClass(Table);
