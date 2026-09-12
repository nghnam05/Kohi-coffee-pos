import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type FoodDocument = HydratedDocument<Food>;

@Schema({ timestamps: true })
export class Food {
  @Prop({
    type: String,
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  price: number;

  @Prop({
    type: String,
    required: true,
  })
  image: string;

  @Prop({
    type: String,
    required: true,
    index: true,
  })
  category: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isAvailable: boolean;

  @Prop({
    type: [String],
    default: [],
  })
  tasteTags: string[];

  @Prop({
    type: Number,
    default: 5.0,
    min: 1,
    max: 5,
  })
  rating: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
  })
  totalReviews: number;

  @Prop({
    type: Number,
    default: 0,
    min: 0,
    index: true,
  })
  soldCount: number;
}

export const FoodSchema = SchemaFactory.createForClass(Food);

// 🚀 Performance Optimization Indexes:
// Fast menu filtering by availability and category
FoodSchema.index({ isAvailable: 1, category: 1 });
FoodSchema.index({ soldCount: -1 });
