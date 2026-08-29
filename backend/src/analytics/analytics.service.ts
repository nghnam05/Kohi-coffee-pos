import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { Payroll, PayrollDocument } from '../salaries/schemas/payroll.schema.js';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema.js';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
  ) {}

  /** Tổng quan nhanh: doanh thu, lương nhân viên, chi phí nguyên liệu, lợi nhuận ròng hôm nay */
  async getSummary(): Promise<any> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfDay);
    startOfWeek.setDate(startOfDay.getDate() - startOfDay.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      todayGross,
      weekGross,
      monthGross,
      totalOrders,
      todaySalary,
      todayIngredientCost,
    ] = await Promise.all([
      this.sumRevenue(startOfDay, now),
      this.sumRevenue(startOfWeek, now),
      this.sumRevenue(startOfMonth, now),
      this.orderModel.countDocuments({ $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] }),
      this.calculateTodaySalaryCost(startOfDay, now),
      this.calculateTodayIngredientCost(startOfDay, now),
    ]);

    const todayNetProfit = Math.max(0, todayGross - todaySalary - todayIngredientCost);

    return {
      todayGross,
      weekGross,
      monthGross,
      todaySalary,
      todayIngredientCost,
      todayNetProfit,
      today: todayNetProfit,
      week: Math.max(0, weekGross - todaySalary * 7),
      month: Math.max(0, monthGross - todaySalary * 30),
      totalOrders,
    };
  }

  private async calculateTodaySalaryCost(startOfDay: Date, now: Date): Promise<number> {
    const attendances = await this.attendanceModel.find({
      checkIn: { $gte: startOfDay, $lte: now },
    }).exec();

    let totalHours = 0;
    const HOURLY_RATE = 25000; // 25.000 VNĐ / giờ mặc định cho nhân viên ca làm

    for (const att of attendances) {
      if (att.totalHours && att.totalHours > 0) {
        totalHours += att.totalHours;
      } else if (att.checkIn) {
        const endTime = att.checkOut ? new Date(att.checkOut).getTime() : now.getTime();
        const durationHours = Math.max(0, (endTime - new Date(att.checkIn).getTime()) / 3600000);
        totalHours += durationHours;
      }
    }

    const calculatedSalary = Math.round(totalHours * HOURLY_RATE);
    const paidSalary = await this.sumPaidSalaries(startOfDay, now);
    return Math.max(calculatedSalary, paidSalary);
  }

  private async calculateTodayIngredientCost(startOfDay: Date, now: Date): Promise<number> {
    // 1. Tính tổng giá trị nguyên liệu tiêu thụ từ giá vốn nguyên liệu trong kho
    const ingredients = await this.ingredientModel.find().exec();
    const totalInventoryValue = ingredients.reduce(
      (sum, item) => sum + (item.currentQuantity || 0) * (item.unitPrice || 0),
      0
    );

    // 2. Tính dựa trên % ước tính (30% doanh thu hôm nay) nếu chưa nhập đủ đơn giá nguyên liệu
    const todayGross = await this.sumRevenue(startOfDay, now);
    const estimatedCOGS = Math.round(todayGross * 0.3);

    // Trả về giá trị thực tế nếu có đơn giá nhập, hoặc 30% doanh thu hôm nay
    return totalInventoryValue > 0 ? Math.min(totalInventoryValue, estimatedCOGS || totalInventoryValue) : estimatedCOGS;
  }

  private async sumRevenue(from: Date, to: Date): Promise<number> {
    const result = await this.orderModel.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] },
            {
              $or: [
                { paidAt: { $gte: from, $lte: to } },
                { createdAt: { $gte: from, $lte: to } },
              ],
            },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  private async sumPaidSalaries(from: Date, to: Date): Promise<number> {
    const result = await this.payrollModel.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ status: 'paid' }, { isPaid: true }] },
            {
              $or: [
                { paidAt: { $gte: from, $lte: to } },
                { updatedAt: { $gte: from, $lte: to } },
                { createdAt: { $gte: from, $lte: to } },
              ],
            },
          ],
        },
      },
      { $group: { _id: null, total: { $sum: '$netSalary' } } },
    ]);
    return result[0]?.total ?? 0;
  }

  /** Doanh thu theo khoảng ngày */
  async getRevenue(from: string, to: string): Promise<any[]> {
    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);
    return this.orderModel.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] },
            {
              $or: [
                { paidAt: { $gte: fromDate, $lte: toDate } },
                { createdAt: { $gte: fromDate, $lte: toDate } },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: { $ifNull: ['$paidAt', '$createdAt'] }, timezone: '+07:00' } },
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
      { $match: { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] } },
      { $unwind: '$items' },
      { $match: { 'items.foodId': { $ne: null } } },
      {
        $lookup: {
          from: 'foods',
          let: { rawFoodId: '$items.foodId' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $or: [
                    { $eq: ['$_id', '$$rawFoodId'] },
                    { $eq: [{ $toString: '$_id' }, { $toString: '$$rawFoodId' }] },
                  ],
                },
              },
            },
          ],
          as: 'foodDoc',
        },
      },
      { $unwind: { path: '$foodDoc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$items.foodId',
          foodName: { $first: { $ifNull: ['$foodDoc.name', 'Món ăn trong Menu'] } },
          foodImage: { $first: '$foodDoc.image' },
          category: { $first: '$foodDoc.category' },
          price: { $first: { $ifNull: ['$foodDoc.price', 0] } },
          totalQuantity: { $sum: '$items.quantity' },
          totalRevenue: {
            $sum: {
              $multiply: [
                '$items.quantity',
                { $ifNull: ['$items.price', { $ifNull: ['$foodDoc.price', 0] }] },
              ],
            },
          },
        },
      },
      { $sort: { totalQuantity: -1, totalRevenue: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          foodId: '$_id',
          foodName: 1,
          foodImage: 1,
          category: 1,
          price: 1,
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
      {
        $match: {
          $and: [
            { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] },
            {
              $or: [
                { paidAt: { $gte: day, $lte: end } },
                { createdAt: { $gte: day, $lte: end } },
              ],
            },
          ],
        },
      },
      {
        $group: {
          _id: { $hour: { date: { $ifNull: ['$paidAt', '$createdAt'] }, timezone: '+07:00' } },
          revenue: { $sum: '$totalAmount' },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
  }
}
