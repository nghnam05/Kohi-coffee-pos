import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ReviewDocument = HydratedDocument<Review>;

@Schema({ _id: false })
export class FoodRating {
  @Prop({ type: Types.ObjectId, ref: 'Food', required: true })
  foodId: Types.ObjectId;

  @Prop({ type: Number, min: 1, max: 5, required: true })
  star: number;

  @Prop({ type: String, maxlength: 200, default: '' })
  comment: string;
}
export const FoodRatingSchema = SchemaFactory.createForClass(FoodRating);

@Schema({ timestamps: true })
export class Review {
  @Prop({ type: Types.ObjectId, ref: 'Order', required: true, unique: true })
  orderId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Table', required: true })
  tableId: Types.ObjectId;

  @Prop({ type: [FoodRatingSchema], default: [] })
  ratings: FoodRating[];

  @Prop({ type: Number, min: 1, max: 5, required: true })
  overallStar: number;

  @Prop({ type: String, maxlength: 300, default: '' })
  overallComment: string;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);
