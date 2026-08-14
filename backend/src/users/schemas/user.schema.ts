import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({
    type: String,
    required: true,
  })
  name: string;

  @Prop({
    type: String,
    unique: true,
    lowercase: true,
    trim: true,
  })
  email: string;

  @Prop({
    type: String,
    required: true,
    select: false,
  })
  password: string;

  @Prop({
    type: String,
    enum: ['admin', 'waiter', 'barista', 'staff'],
    default: 'waiter',
  })
  role: string;

  @Prop({
    type: String,
    enum: ['morning', 'afternoon', 'evening'],
    default: 'morning',
  })
  assignedShift: string; // Ca phân công mặc định: 'morning' | 'afternoon' | 'evening'
}

export const UserSchema = SchemaFactory.createForClass(User);
