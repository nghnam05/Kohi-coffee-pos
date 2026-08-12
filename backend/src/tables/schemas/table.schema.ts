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
    enum: ['empty', 'serving', 'reserved'],
    default: 'empty',
  })
  status: string;
}

export const TableSchema = SchemaFactory.createForClass(Table);
