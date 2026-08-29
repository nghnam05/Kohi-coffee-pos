import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class ReviewsService implements OnModuleInit {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    try {
      // Clear existing seed reviews from database
      const result = await this.reviewModel.deleteMany({
        $or: [
          { overallComment: { $regex: /Cà phê rất thơm ngon|Bánh ngọt tươi mới/i } },
          { 'ratings.comment': 'Hương vị tuyệt vời!' }
        ]
      });
      if (result.deletedCount > 0) {
        console.log(`[Clean] Cleared ${result.deletedCount} seed reviews from database.`);
      }
    } catch (err) {
      console.error('[Clean Error] Failed to clear seed reviews:', err);
    }
  }

  async create(dto: CreateReviewDto): Promise<ReviewDocument> {
    // 1. Kiểm tra đơn hàng tồn tại và đã được phục vụ / thanh toán
    const order = await this.orderModel.findById(dto.orderId).lean();
    if (!order) throw new NotFoundException('Không tìm thấy đơn hàng.');
    if (order.status !== 'paid' && order.status !== 'completed') {
      throw new BadRequestException('Chỉ có thể đánh giá đơn hàng đã hoàn thành hoặc thanh toán.');
    }

    // 2. Kiểm tra đã review chưa (unique orderId)
    const existing = await this.reviewModel.findOne({ orderId: dto.orderId }).lean();
    if (existing) throw new ConflictException('Đơn hàng này đã được đánh giá rồi.');

    const review = new this.reviewModel(dto);
    return review.save();
  }

  /** Lấy tất cả reviews (admin) */
  async findAll(): Promise<any[]> {
    return this.reviewModel
      .find()
      .populate('orderId', 'totalAmount createdAt customerName items')
      .populate('tableId', 'tableName')
      .populate('ratings.foodId', 'name image price')
      .sort({ createdAt: -1 })
      .lean()
      .exec();
  }

  /** Reviews theo món ăn */
  async findByFood(foodId: string): Promise<any[]> {
    let foodObjId: Types.ObjectId | null = null;
    try {
      foodObjId = new Types.ObjectId(foodId);
    } catch (e) {}

    const filter = foodObjId
      ? { $or: [{ 'ratings.foodId': foodId }, { 'ratings.foodId': foodObjId }] }
      : { 'ratings.foodId': foodId };

    const reviews = await this.reviewModel
      .find(filter)
      .populate('tableId', 'tableName')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return reviews.map((r) => ({
      ...r,
      foodRating: r.ratings.find(
        (rt: any) => rt.foodId?.toString() === foodId
      ),
    }));
  }

  /** Tóm tắt điểm đánh giá theo món */
  async getRatingSummary(foodId: string): Promise<{ avgStar: number; totalReviews: number }> {
    let foodObjId: Types.ObjectId | null = null;
    try {
      foodObjId = new Types.ObjectId(foodId);
    } catch (e) {}

    const matchCondition = foodObjId
      ? {
          $expr: {
            $or: [
              { $eq: ['$ratings.foodId', foodObjId] },
              { $eq: [{ $toString: '$ratings.foodId' }, foodId] },
            ],
          },
        }
      : {
          $expr: {
            $eq: [{ $toString: '$ratings.foodId' }, foodId],
          },
        };

    const result = await this.reviewModel.aggregate([
      { $match: { 'ratings.0': { $exists: true } } },
      { $unwind: '$ratings' },
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          avgStar: { $avg: '$ratings.star' },
          totalReviews: { $sum: 1 },
        },
      },
    ]);
    if (result.length === 0) return { avgStar: 0, totalReviews: 0 };
    return { avgStar: Math.round(result[0].avgStar * 10) / 10, totalReviews: result[0].totalReviews };
  }

  /** Kiểm tra đơn hàng đã được review chưa */
  async findByOrder(orderId: string): Promise<ReviewDocument | null> {
    return this.reviewModel.findOne({ orderId }).lean() as any;
  }

  /** Admin xóa review vi phạm */
  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.reviewModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Không tìm thấy đánh giá.');
    return { message: 'Đã xóa đánh giá thành công.' };
  }
}
