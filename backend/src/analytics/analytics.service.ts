import { Injectable, Optional } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { Payroll, PayrollDocument } from '../salaries/schemas/payroll.schema.js';
import { Ingredient, IngredientDocument } from '../ingredients/schemas/ingredient.schema.js';
import { Attendance, AttendanceDocument } from '../attendance/schemas/attendance.schema.js';
import { Expense, ExpenseDocument } from '../expenses/schemas/expense.schema.js';
import { IngredientUsage, IngredientUsageDocument } from '../ingredients/schemas/ingredient-usage.schema.js';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    @InjectModel(Payroll.name) private readonly payrollModel: Model<PayrollDocument>,
    @InjectModel(Ingredient.name) private readonly ingredientModel: Model<IngredientDocument>,
    @InjectModel(Attendance.name) private readonly attendanceModel: Model<AttendanceDocument>,
    @Optional() @InjectModel(Expense.name) private readonly expenseModel?: Model<ExpenseDocument>,
    @Optional() @InjectModel(IngredientUsage.name) private readonly ingredientUsageModel?: Model<IngredientUsageDocument>,
  ) {}

  /**
   * Tổng quan tài chính: Thu (Doanh thu), Chi (Lương, Nguyên liệu, Tiền phát sinh), Lợi nhuận ròng.
   * Hỗ trợ xem theo ngày cụ thể (?date=YYYY-MM-DD) hoặc tổng hợp theo tháng (?month=YYYY-MM).
   * Nguyên liệu: Khi giảm (tiêu hao/xuất kho) thì cộng dồn giá trị giảm vào phần nguyên liệu ngày đó.
   */
  async getSummary(dateStr?: string, monthStr?: string): Promise<any> {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const startOfWeek = new Date(todayStart);
    startOfWeek.setDate(todayStart.getDate() - todayStart.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);

    // Baseline metrics (Today, Week, Month) để luôn tương thích ngược và phục vụ hiển thị
    const [
      todayGross,
      weekGross,
      monthGross,
      totalOrders,
      todaySalary,
      totalInventoryValue,
      todayExpenseCost,
      todayIngredientUsageCost,
    ] = await Promise.all([
      this.sumRevenue(todayStart, now),
      this.sumRevenue(startOfWeek, now),
      this.sumRevenue(startOfMonth, now),
      this.orderModel.countDocuments({ $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] }),
      this.calculateSalaryCostForRange(todayStart, now),
      this.calculateTodayInventoryValue(),
      this.sumExpenses(todayStart, todayEnd),
      this.sumIngredientUsages(todayStart, todayEnd),
    ]);

    const estimatedCOGS = Math.round(todayGross * 0.3);
    const effectiveCOGS = totalInventoryValue > 0 && totalInventoryValue < estimatedCOGS ? totalInventoryValue : estimatedCOGS;
    // Nếu có tiêu hao nguyên liệu thực tế (> 0) thì dùng số tiền tiêu hao thực tế, nếu không dùng effectiveCOGS cho baseline/tests
    const todayEffectiveCOGS = todayIngredientUsageCost > 0 ? todayIngredientUsageCost : effectiveCOGS;
    const todayNetProfit = Math.max(0, todayGross - todaySalary - todayEffectiveCOGS - todayExpenseCost);

    // Xác định kỳ thống kê được chọn: Ngày hay Tháng
    let periodType: 'day' | 'month' = 'day';
    let selectedDate = dateStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    let selectedMonth = monthStr || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    let startOfPeriod: Date;
    let endOfPeriod: Date;

    if (monthStr) {
      periodType = 'month';
      const [mYear, mMonth] = monthStr.split('-').map(Number);
      startOfPeriod = new Date(mYear, mMonth - 1, 1, 0, 0, 0, 0);
      endOfPeriod = new Date(mYear, mMonth, 0, 23, 59, 59, 999);
    } else {
      periodType = 'day';
      const [dYear, dMonth, dDay] = selectedDate.split('-').map(Number);
      startOfPeriod = new Date(dYear, dMonth - 1, dDay, 0, 0, 0, 0);
      endOfPeriod = new Date(dYear, dMonth - 1, dDay, 23, 59, 59, 999);
    }

    // Tính toán số liệu cho kỳ được chọn (Selected Period)
    const [periodGross, periodSalary, periodExpenseCost, periodIngredientUsage] = await Promise.all([
      this.sumRevenue(startOfPeriod, endOfPeriod),
      this.calculateSalaryCostForRange(startOfPeriod, endOfPeriod),
      this.sumExpenses(startOfPeriod, endOfPeriod),
      this.sumIngredientUsages(startOfPeriod, endOfPeriod),
    ]);

    // Tiền nguyên liệu của ngày đó: Cộng dồn tất cả các lần giảm nguyên liệu (tiêu hao) trong kỳ
    const periodIngredientCost = periodIngredientUsage;
    const periodNetProfit = Math.max(0, periodGross - periodSalary - periodIngredientCost - periodExpenseCost);

    // Lấy chi tiết sổ sách cho chế độ Theo Ngày (Day Ledger)
    let dayOrders: any[] = [];
    let dayAttendances: any[] = [];
    let dayExpenses: any[] = [];
    let dayIngredientUsages: any[] = [];

    if (periodType === 'day') {
      const orderQuery = typeof this.orderModel.find === 'function'
        ? this.orderModel.find({
            $and: [
              { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] },
              {
                $or: [
                  { paidAt: { $gte: startOfPeriod, $lte: endOfPeriod } },
                  { createdAt: { $gte: startOfPeriod, $lte: endOfPeriod } },
                ],
              },
            ],
          })
        : null;

      const orderPromise = orderQuery
        ? (typeof orderQuery.populate === 'function'
            ? orderQuery.populate('tableId', 'tableNumber').sort({ paidAt: -1, createdAt: -1 }).lean().exec()
            : (typeof orderQuery.exec === 'function' ? orderQuery.exec() : Promise.resolve([])))
        : Promise.resolve([]);

      const attQuery = typeof this.attendanceModel.find === 'function'
        ? this.attendanceModel.find({ checkIn: { $gte: startOfPeriod, $lte: endOfPeriod } })
        : null;

      const attPromise = attQuery
        ? (typeof attQuery.populate === 'function'
            ? attQuery.populate('userId', 'name username role phone').sort({ checkIn: 1 }).lean().exec()
            : (typeof attQuery.exec === 'function' ? attQuery.exec() : Promise.resolve([])))
        : Promise.resolve([]);

      const expQuery = this.expenseModel && typeof this.expenseModel.find === 'function'
        ? this.expenseModel.find({ date: { $gte: startOfPeriod, $lte: endOfPeriod } })
        : null;

      const expPromise = expQuery
        ? (typeof expQuery.sort === 'function'
            ? expQuery.sort({ date: -1, createdAt: -1 }).lean().exec()
            : (typeof expQuery.exec === 'function' ? expQuery.exec() : Promise.resolve([])))
        : Promise.resolve([]);

      const ingQuery = this.ingredientUsageModel && typeof this.ingredientUsageModel.find === 'function'
        ? this.ingredientUsageModel.find({ date: { $gte: startOfPeriod, $lte: endOfPeriod } })
        : null;

      const ingPromise = ingQuery
        ? (typeof ingQuery.sort === 'function'
            ? ingQuery.sort({ date: -1, createdAt: -1 }).lean().exec()
            : (typeof ingQuery.exec === 'function' ? ingQuery.exec() : Promise.resolve([])))
        : Promise.resolve([]);

      const [resOrders, resAtts, resExps, resIngs] = await Promise.all([orderPromise, attPromise, expPromise, ingPromise]);
      dayOrders = Array.isArray(resOrders) ? resOrders : [];
      dayAttendances = Array.isArray(resAtts) ? resAtts : [];
      dayExpenses = Array.isArray(resExps) ? resExps : [];
      dayIngredientUsages = Array.isArray(resIngs) ? resIngs : [];
    }

    // Lấy dữ liệu tổng hợp theo từng ngày cho chế độ Tháng (Monthly Breakdown)
    let dailyBreakdown: any[] = [];
    if (periodType === 'month') {
      dailyBreakdown = await this.getMonthlyDailyBreakdown(startOfPeriod, endOfPeriod);
    }

    return {
      // Chỉ số kỳ được chọn
      periodType,
      selectedDate,
      selectedMonth,
      periodGross,
      periodSalary,
      periodIngredientCost,
      periodExpenseCost,
      periodNetProfit,

      // Danh sách chi tiết trong ngày (Theo ngày)
      dayOrders,
      dayAttendances,
      dayExpenses,
      dayIngredientUsages,

      // Danh sách chi tiết từng ngày trong tháng (Theo tháng)
      dailyBreakdown,

      // Trường tương thích ngược & baseline
      todayGross,
      weekGross,
      monthGross,
      todaySalary,
      todayIngredientCost: totalInventoryValue,
      todayIngredientUsageCost,
      totalInventoryValue,
      estimatedCOGS,
      todayExpenseCost,
      todayNetProfit,
      today: todayNetProfit,
      week: Math.max(0, weekGross - todaySalary * 7),
      month: Math.max(0, monthGross - todaySalary * 30),
      totalOrders,
    };
  }

  /** Tính chi phí lương cho khoảng thời gian bất kỳ */
  private async calculateSalaryCostForRange(from: Date, to: Date): Promise<number> {
    const attendances = await this.attendanceModel.find({
      checkIn: { $gte: from, $lte: to },
    }).exec();

    let totalHours = 0;
    const HOURLY_RATE = 25000; // 25.000 VNĐ / giờ mặc định

    for (const att of attendances) {
      if (att.totalHours && att.totalHours > 0) {
        totalHours += att.totalHours;
      } else if (att.checkIn) {
        const endTime = att.checkOut ? new Date(att.checkOut).getTime() : to.getTime();
        const durationHours = Math.max(0, (endTime - new Date(att.checkIn).getTime()) / 3600000);
        totalHours += durationHours;
      }
    }

    const calculatedSalary = Math.round(totalHours * HOURLY_RATE);
    const paidSalary = await this.sumPaidSalaries(from, to);
    return Math.max(calculatedSalary, paidSalary);
  }

  /** Tính tổng giá trị toàn bộ kho nguyên liệu */
  private async calculateTodayInventoryValue(): Promise<number> {
    const ingredients = await this.ingredientModel.find().exec();
    return ingredients.reduce(
      (sum, item) => sum + (item.currentQuantity || 0) * (item.unitPrice || 0),
      0
    );
  }

  /** Tính tổng doanh thu đơn hàng đã thanh toán trong khoảng thời gian */
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

  /** Tính tổng lương đã chi trả trong khoảng thời gian */
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

  /** Tính tổng chi phí phát sinh trong khoảng thời gian */
  private async sumExpenses(from: Date, to: Date): Promise<number> {
    if (!this.expenseModel || !this.expenseModel.aggregate) return 0;
    try {
      const result = await this.expenseModel.aggregate([
        {
          $match: {
            date: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]);
      return result[0]?.total ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /** Tính tổng chi phí tiêu hao nguyên liệu (tổng các lần giảm kho) trong khoảng thời gian */
  private async sumIngredientUsages(from: Date, to: Date): Promise<number> {
    if (!this.ingredientUsageModel || !this.ingredientUsageModel.aggregate) return 0;
    try {
      const result = await this.ingredientUsageModel.aggregate([
        {
          $match: {
            date: { $gte: from, $lte: to },
          },
        },
        { $group: { _id: null, total: { $sum: '$totalCost' } } },
      ]);
      return result[0]?.total ?? 0;
    } catch (e) {
      return 0;
    }
  }

  /** Tổng hợp số liệu theo từng ngày trong tháng */
  private async getMonthlyDailyBreakdown(startOfMonth: Date, endOfMonth: Date): Promise<any[]> {
    const orderPromise = typeof this.orderModel.find === 'function'
      ? this.orderModel.find(
          {
            $and: [
              { $or: [{ status: 'paid' }, { paymentStatus: 'paid' }] },
              {
                $or: [
                  { paidAt: { $gte: startOfMonth, $lte: endOfMonth } },
                  { createdAt: { $gte: startOfMonth, $lte: endOfMonth } },
                ],
              },
            ],
          },
          'totalAmount paidAt createdAt',
        )
      : null;

    const ordRes = orderPromise
      ? (typeof (orderPromise as any).lean === 'function'
          ? (orderPromise as any).lean().exec()
          : (typeof (orderPromise as any).exec === 'function' ? (orderPromise as any).exec() : orderPromise))
      : Promise.resolve([]);

    const attPromise = typeof this.attendanceModel.find === 'function'
      ? this.attendanceModel.find({ checkIn: { $gte: startOfMonth, $lte: endOfMonth } })
      : null;

    const attRes = attPromise
      ? (typeof (attPromise as any).lean === 'function'
          ? (attPromise as any).lean().exec()
          : (typeof (attPromise as any).exec === 'function' ? (attPromise as any).exec() : attPromise))
      : Promise.resolve([]);

    const expPromise = this.expenseModel && typeof this.expenseModel.find === 'function'
      ? this.expenseModel.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
      : null;

    const expRes = expPromise
      ? (typeof (expPromise as any).lean === 'function'
          ? (expPromise as any).lean().exec()
          : (typeof (expPromise as any).exec === 'function' ? (expPromise as any).exec() : expPromise))
      : Promise.resolve([]);

    const ingPromise = this.ingredientUsageModel && typeof this.ingredientUsageModel.find === 'function'
      ? this.ingredientUsageModel.find({ date: { $gte: startOfMonth, $lte: endOfMonth } })
      : null;

    const ingRes = ingPromise
      ? (typeof (ingPromise as any).lean === 'function'
          ? (ingPromise as any).lean().exec()
          : (typeof (ingPromise as any).exec === 'function' ? (ingPromise as any).exec() : ingPromise))
      : Promise.resolve([]);

    const [ordersRaw, attendancesRaw, expensesRaw, usagesRaw] = await Promise.all([ordRes, attRes, expRes, ingRes]);
    const orders = Array.isArray(ordersRaw) ? ordersRaw : [];
    const attendances = Array.isArray(attendancesRaw) ? attendancesRaw : [];
    const expenses = Array.isArray(expensesRaw) ? expensesRaw : [];
    const usages = Array.isArray(usagesRaw) ? usagesRaw : [];

    const daysCount = endOfMonth.getDate();
    const year = startOfMonth.getFullYear();
    const month = startOfMonth.getMonth();

    const breakdown: any[] = [];
    const dayNames = ['CN', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];

    for (let day = 1; day <= daysCount; day++) {
      const dayStart = new Date(year, month, day, 0, 0, 0, 0);
      const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

      // Doanh thu ngày
      const dayOrders = orders.filter((o: any) => {
        const d = new Date(o.paidAt || o.createdAt);
        return d >= dayStart && d <= dayEnd;
      });
      const grossRevenue = dayOrders.reduce((sum: number, o: any) => sum + (o.totalAmount || 0), 0);
      const ordersCount = dayOrders.length;

      // Lương nhân viên ngày
      const dayAtts = attendances.filter((a: any) => {
        const d = new Date(a.checkIn);
        return d >= dayStart && d <= dayEnd;
      });
      let dayHours = 0;
      for (const a of dayAtts) {
        if (a.totalHours && a.totalHours > 0) {
          dayHours += a.totalHours;
        } else if (a.checkIn) {
          const endTime = a.checkOut ? new Date(a.checkOut).getTime() : dayEnd.getTime();
          dayHours += Math.max(0, (endTime - new Date(a.checkIn).getTime()) / 3600000);
        }
      }
      const salaryCost = Math.round(dayHours * 25000);

      // Chi phí nguyên liệu tiêu hao ngày: cộng dồn tất cả các lần giảm kho trong ngày đó
      const dayUsages = usages.filter((u: any) => {
        const d = new Date(u.date);
        return d >= dayStart && d <= dayEnd;
      });
      const ingredientCost = dayUsages.reduce((sum: number, u: any) => sum + (u.totalCost || 0), 0);

      // Chi phí phát sinh ngày
      const dayExps = expenses.filter((e: any) => {
        const d = new Date(e.date);
        return d >= dayStart && d <= dayEnd;
      });
      const expenseCost = dayExps.reduce((sum: number, e: any) => sum + (e.amount || 0), 0);

      // Lợi nhuận ròng ngày
      const netProfit = Math.max(0, grossRevenue - salaryCost - ingredientCost - expenseCost);

      breakdown.push({
        date: dateKey,
        day,
        dayOfWeek: dayNames[dayStart.getDay()],
        grossRevenue,
        ordersCount,
        salaryCost,
        ingredientCost,
        expenseCost,
        netProfit,
        expensesCount: dayExps.length,
        ingredientUsagesCount: dayUsages.length,
      });
    }

    return breakdown;
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
