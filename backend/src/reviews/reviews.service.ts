import {
  Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Review, ReviewDocument } from './schemas/review.schema.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { CreateReviewDto } from './dto/create-review.dto.js';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Review.name) private readonly reviewModel: Model<ReviewDocument>,
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

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
  async findAll(): Promise<ReviewDocument[]> {
    return this.reviewModel
      .find()
      .populate('orderId', 'totalAmount createdAt')
      .populate('tableId', 'tableName')
      .sort({ createdAt: -1 })
      .exec();
  }

  /** Reviews theo món ăn */
  async findByFood(foodId: string): Promise<any[]> {
    const reviews = await this.reviewModel
      .find({ 'ratings.foodId': foodId })
      .populate('tableId', 'tableName')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    return reviews.map((r) => ({
      ...r,
      foodRating: r.ratings.find((rt: any) => rt.foodId?.toString() === foodId),
    }));
  }

  /** Tóm tắt điểm đánh giá theo món */
  async getRatingSummary(foodId: string): Promise<{ avgStar: number; totalReviews: number }> {
    const result = await this.reviewModel.aggregate([
      { $match: { 'ratings.foodId': { $exists: true } } },
      { $unwind: '$ratings' },
      { $match: { 'ratings.foodId': { $toString: foodId } } },
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
