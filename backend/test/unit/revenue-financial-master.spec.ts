import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { OrdersService } from '../../src/orders/orders.service';
import { CouponsService } from '../../src/coupons/coupons.service';
import { PaymentsService } from '../../src/payments/payments.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../../src/orders/schemas/order.schema';
import { Payroll } from '../../src/salaries/schemas/payroll.schema';
import { Ingredient } from '../../src/ingredients/schemas/ingredient.schema';
import { Attendance } from '../../src/attendance/schemas/attendance.schema';
import { Coupon } from '../../src/coupons/schemas/coupon.schema';
import { Food } from '../../src/foods/schemas/food.schema';
import { Table } from '../../src/tables/schemas/table.schema';
import { FoodsService } from '../../src/foods/foods.service';
import { TablesService } from '../../src/tables/tables.service';
import { OrdersGateway } from '../../src/orders/orders.gateway';

/**
 * COMPREHENSIVE REVENUE & FINANCIAL LOGIC TEST SUITE
 * Test suite kiểm tra chuyên sâu Logic Doanh Thu, Chi Phí, Lợi Nhuận Ròng & Mã Giảm Giá
 */
describe('REVENUE & FINANCIAL MASTER TEST SUITE (Master QA Revenue Suite)', () => {
  let analyticsService: AnalyticsService;
  let ordersService: OrdersService;
  let couponsService: CouponsService;

  let orderModelMock: any;
  let payrollModelMock: any;
  let ingredientModelMock: any;
  let attendanceModelMock: any;
  let couponModelMock: any;
  let foodModelMock: any;
  let tableModelMock: any;

  beforeEach(async () => {
    orderModelMock = {
      countDocuments: jest.fn().mockResolvedValue(25),
      aggregate: jest.fn(),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      findById: jest.fn(),
      insertMany: jest.fn(),
    };

    payrollModelMock = {
      aggregate: jest.fn().mockResolvedValue([{ total: 1500000 }]),
    };

    ingredientModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { name: 'Cà phê hạt', currentQuantity: 10, unitPrice: 150000 }, // 1.500.000 VNĐ
          { name: 'Sữa đặc', currentQuantity: 20, unitPrice: 25000 },      // 500.000 VNĐ
        ]),
      }),
    };

    attendanceModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { totalHours: 8, checkIn: new Date(), checkOut: new Date() },
          { totalHours: 7.5, checkIn: new Date(), checkOut: new Date() },
        ]),
      }),
    };

    couponModelMock = {
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([]) }),
    };

    foodModelMock = {
      findById: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
    };

    tableModelMock = {
      findById: jest.fn(),
      find: jest.fn().mockResolvedValue([]),
      findByIdAndUpdate: jest.fn(),
    };

    function MockOrderConstructor(dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: '507f191e810c19729de860f1', ...dto });
    }
    Object.assign(MockOrderConstructor, orderModelMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        OrdersService,
        CouponsService,
        { provide: PaymentsService, useValue: { createFromOrder: jest.fn().mockResolvedValue({}) } },
        { provide: FoodsService, useValue: { findAll: jest.fn().mockResolvedValue([]), findOne: jest.fn() } },
        { provide: TablesService, useValue: { findAll: jest.fn().mockResolvedValue([]), findOne: jest.fn(), update: jest.fn() } },
        { provide: getModelToken(Order.name), useValue: MockOrderConstructor },
        { provide: getModelToken(Payroll.name), useValue: payrollModelMock },
        { provide: getModelToken(Ingredient.name), useValue: ingredientModelMock },
        { provide: getModelToken(Attendance.name), useValue: attendanceModelMock },
        { provide: getModelToken(Coupon.name), useValue: couponModelMock },
        { provide: getModelToken(Food.name), useValue: foodModelMock },
        { provide: getModelToken(Table.name), useValue: tableModelMock },
        {
          provide: OrdersGateway,
          useValue: {
            emitNewOrder: jest.fn(),
            emitStatusUpdate: jest.fn(),
            emitClearGroupCart: jest.fn(),
          },
        },
      ],
    }).compile();

    analyticsService = module.get<AnalyticsService>(AnalyticsService);
    ordersService = module.get<OrdersService>(OrdersService);
    couponsService = module.get<CouponsService>(CouponsService);
  });

  // ==========================================
  // MODULE 1: DOANH THU THÔ & LỢI NHUẬN RÒNG
  // ==========================================
  describe('MODULE 1: Executive Summary & Profit Calculations', () => {
    it('TC-REV-001: Tính Doanh thu gộp (Gross Revenue) chính xác theo trạng thái đã thanh toán', async () => {
      orderModelMock.aggregate
        .mockResolvedValueOnce([{ total: 10000000 }]) // Today gross: 10 triệu
        .mockResolvedValueOnce([{ total: 45000000 }]) // Week gross: 45 triệu
        .mockResolvedValueOnce([{ total: 180000000 }]) // Month gross: 180 triệu
        .mockResolvedValueOnce([{ total: 10000000 }]); // Today gross for COGS estimation

      const summary = await analyticsService.getSummary();

      expect(summary.todayGross).toBe(10000000);
      expect(summary.weekGross).toBe(45000000);
      expect(summary.monthGross).toBe(180000000);
      expect(summary.totalOrders).toBe(25);
    });

    it('TC-REV-002: Kiểm tra công thức Lợi Nhuận Ròng (Net Profit) = Gross - Salary - COGS', async () => {
      orderModelMock.aggregate
        .mockResolvedValueOnce([{ total: 10000000 }])
        .mockResolvedValueOnce([{ total: 50000000 }])
        .mockResolvedValueOnce([{ total: 200000000 }])
        .mockResolvedValueOnce([{ total: 10000000 }]);

      const summary = await analyticsService.getSummary();

      expect(summary.todayGross).toBe(10000000);
      expect(summary.todaySalary).toBe(1500000);
      expect(summary.todayIngredientCost).toBe(2000000);
      expect(summary.todayNetProfit).toBe(6500000);
    });

    it('TC-REV-003: Đảm bảo Lợi Nhuận Ròng không âm (Non-negative floor constraint)', async () => {
      orderModelMock.aggregate
        .mockResolvedValueOnce([{ total: 500000 }])  // Doanh thu chỉ 500k
        .mockResolvedValueOnce([{ total: 2000000 }])
        .mockResolvedValueOnce([{ total: 8000000 }])
        .mockResolvedValueOnce([{ total: 500000 }]);

      payrollModelMock.aggregate.mockResolvedValueOnce([{ total: 3000000 }]); // Lương 3M

      const summary = await analyticsService.getSummary();

      expect(summary.todayGross).toBe(500000);
      expect(summary.todayNetProfit).toBe(0);
      expect(summary.today).toBe(0);
    });
  });

  // ==========================================
  // MODULE 2: MÃ GIẢM GIÁ & DOANH THU SAU GIẢM
  // ==========================================
  describe('MODULE 2: Coupon Discount Impact on Revenue', () => {
    it('TC-REV-004: Áp dụng mã giảm giá phần trăm (%) chính xác vào đơn hàng', async () => {
      couponModelMock.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          code: 'KOHI20',
          type: 'percent',
          value: 20,
          maxDiscount: 50000,
          minOrderAmount: 100000,
          isActive: true,
          maxUsage: 100,
          usedCount: 5,
          expiresAt: new Date(Date.now() + 1000000),
        }),
      });

      const couponResult = await couponsService.validate('KOHI20', 300000);
      expect(couponResult.valid).toBe(true);
      expect(couponResult.discountAmount).toBe(50000);
    });

    it('TC-REV-005: Áp dụng mã giảm giá cố định (fixed VNĐ) chính xác', async () => {
      couponModelMock.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          code: 'SALE30K',
          type: 'fixed',
          value: 30000,
          minOrderAmount: 50000,
          isActive: true,
          maxUsage: 50,
          usedCount: 2,
          expiresAt: new Date(Date.now() + 1000000),
        }),
      });

      const couponResult = await couponsService.validate('SALE30K', 150000);
      expect(couponResult.valid).toBe(true);
      expect(couponResult.discountAmount).toBe(30000);
    });

    it('TC-REV-006: Từ chối mã giảm giá khi đơn hàng chưa đạt giá trị tối thiểu', async () => {
      couponModelMock.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          code: 'KOHIVIP',
          type: 'percent',
          value: 10,
          minOrderAmount: 200000,
          isActive: true,
          expiresAt: new Date(Date.now() + 1000000),
        }),
      });

      const couponResult = await couponsService.validate('KOHIVIP', 150000);
      expect(couponResult.valid).toBe(false);
      expect(couponResult.discountAmount).toBe(0);
    });
  });

  // ==========================================
  // MODULE 3: THỐNG KÊ DOANH THU THEO KHOẢNG THỜI GIAN
  // ==========================================
  describe('MODULE 3: Timeframe Aggregations & Top Selling Analysis', () => {
    it('TC-REV-007: Thống kê doanh thu theo dãy ngày (getRevenue)', async () => {
      const mockDaily = [
        { _id: '2026-08-29', revenue: 4200000, orders: 18 },
        { _id: '2026-08-30', revenue: 5800000, orders: 24 },
        { _id: '2026-08-31', revenue: 6100000, orders: 28 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockDaily);

      const result = await analyticsService.getRevenue('2026-08-29', '2026-08-31');

      expect(result.length).toBe(3);
      expect(result[0].revenue).toBe(4200000);
      expect(result[2].revenue).toBe(6100000);
    });

    it('TC-REV-008: Thống kê doanh thu phân bổ theo khung giờ trong ngày (getHourly)', async () => {
      const mockHourly = [
        { _id: 7, revenue: 1200000, orders: 6 },
        { _id: 8, revenue: 2500000, orders: 12 },
        { _id: 9, revenue: 1800000, orders: 9 },
        { _id: 14, revenue: 900000, orders: 4 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockHourly);

      const hourlyData = await analyticsService.getHourly('2026-08-31');

      expect(hourlyData.length).toBe(4);
      expect(hourlyData[1]._id).toBe(8);
      expect(hourlyData[1].revenue).toBe(2500000);
    });

    it('TC-REV-009: Thống kê Top Món ăn mang lại doanh thu cao nhất (getTopFoods)', async () => {
      const mockTopFoods = [
        { foodId: '507f191e810c19729de860fa', foodName: 'Cà phê muối', totalQuantity: 120, totalRevenue: 4200000 },
        { foodId: '507f191e810c19729de860fb', foodName: 'Trà đào cam sả', totalQuantity: 95, totalRevenue: 3800000 },
        { foodId: '507f191e810c19729de860fc', foodName: 'Bạc xỉu', totalQuantity: 80, totalRevenue: 2800000 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockTopFoods);

      const topFoods = await analyticsService.getTopFoods(3);

      expect(topFoods.length).toBe(3);
      expect(topFoods[0].foodName).toBe('Cà phê muối');
      expect(topFoods[0].totalRevenue).toBe(4200000);
    });
  });

  // ==========================================
  // MODULE 4: BIÊN ĐỘ GIÁ & NGUYÊN TẮC AN TOÀN TÀI CHÍNH
  // ==========================================
  describe('MODULE 4: Boundary Testing & Edge Cases', () => {
    it('TC-REV-010: Xử lý chính xác trường hợp không có đơn hàng nào trong ngày (0 Revenue)', async () => {
      orderModelMock.aggregate
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      payrollModelMock.aggregate.mockResolvedValueOnce([]);
      ingredientModelMock.find.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([]) });
      attendanceModelMock.find.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([]) });

      const summary = await analyticsService.getSummary();

      expect(summary.todayGross).toBe(0);
      expect(summary.todaySalary).toBe(0);
      expect(summary.todayIngredientCost).toBe(0);
      expect(summary.todayNetProfit).toBe(0);
    });

    it('TC-REV-011: Đơn hàng bị hủy (cancelled) không được cộng vào Doanh Thu', async () => {
      orderModelMock.aggregate.mockResolvedValueOnce([{ total: 0 }]);
      const revenue = await analyticsService.getRevenue('2026-08-31', '2026-08-31');
      expect(revenue).toEqual([{ total: 0 }]);
    });
  });
});
