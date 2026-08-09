import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
  ) {}

  /** Tổng quan nhanh: hôm nay, tuần này, tháng này */
  async getSummary(): Promise<any> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [today, week, month, totalOrders] = await Promise.all([
      this.sumRevenue(startOfDay, now),
      this.sumRevenue(startOfWeek, now),
      this.sumRevenue(startOfMonth, now),
      this.orderModel.countDocuments({ status: 'paid' }),
    ]);
    return { today, week, month, totalOrders };
  }

  private async sumRevenue(from: Date, to: Date): Promise<number> {
    const result = await this.orderModel.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: from, $lte: to } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  /** Doanh thu theo khoảng ngày */
  async getRevenue(from: string, to: string): Promise<any[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    return this.orderModel.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: '+07:00' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }

  /** Top món bán chạy */
  async getTopFoods(limit: number = 10): Promise<any[]> {
    return this.orderModel.aggregate([
      { $match: { status: 'paid' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.foodId',
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.price', 0] }] } },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: limit },
      {
        $lookup: {
          from: 'foods',
          localField: '_id',
          foreignField: '_id',
          as: 'food',
        },
      },
      { $unwind: { path: '$food', preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          foodId: '$_id',
          foodName: { $ifNull: ['$food.name', 'Món đã xóa'] },
          foodImage: '$food.image',
          totalQuantity: 1,
          totalRevenue: 1,
        },
      },
    ]);
  }

  /** Doanh thu theo giờ trong 1 ngày */
  async getHourly(date: string): Promise<any[]> {
    const day = new Date(date);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    return this.orderModel.aggregate([
      { $match: { status: 'paid', createdAt: { $gte: day, $lte: end } } },
      {
        $group: {
          _id: { $hour: { date: '$createdAt', timezone: '+07:00' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
