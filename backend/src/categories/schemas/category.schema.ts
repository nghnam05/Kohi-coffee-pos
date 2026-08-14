import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type CategoryDocument = HydratedDocument<Category>;

@Schema({ timestamps: true })
export class Category {
  @Prop({
    type: String,
    required: true,
    trim: true,
    unique: true,
  })
  name: string;

  @Prop({
    type: String,
    default: 'local_cafe',
  })
  icon?: string;

  @Prop({
    type: Number,
    default: 0,
  })
  order?: number;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive?: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
