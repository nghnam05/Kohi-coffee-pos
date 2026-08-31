import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../../src/orders/schemas/order.schema';
import { Payroll } from '../../src/salaries/schemas/payroll.schema';
import { Ingredient } from '../../src/ingredients/schemas/ingredient.schema';
import { Attendance } from '../../src/attendance/schemas/attendance.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let orderModelMock: any;
  let payrollModelMock: any;
  let ingredientModelMock: any;
  let attendanceModelMock: any;

  beforeEach(async () => {
    orderModelMock = {
      countDocuments: jest.fn().mockResolvedValue(15),
      aggregate: jest.fn().mockResolvedValue([{ total: 5000000 }]),
    };

    payrollModelMock = {
      aggregate: jest.fn().mockResolvedValue([{ total: 1200000 }]),
    };

    ingredientModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { currentQuantity: 10, unitPrice: 50000 },
        ]),
      }),
    };

    attendanceModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          { totalHours: 8, checkIn: new Date(), checkOut: new Date() },
        ]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(Order.name), useValue: orderModelMock },
        { provide: getModelToken(Payroll.name), useValue: payrollModelMock },
        { provide: getModelToken(Ingredient.name), useValue: ingredientModelMock },
        { provide: getModelToken(Attendance.name), useValue: attendanceModelMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should calculate gross revenue, salaries, ingredient costs and net profit', async () => {
      const result = await service.getSummary();
      expect(result).toBeDefined();
      expect(result.todayGross).toBe(5000000);
      expect(result.todaySalary).toBe(1200000);
      expect(result.totalOrders).toBe(15);
      expect(result.todayNetProfit).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTopFoods', () => {
    it('should return aggregated top selling foods', async () => {
      const mockTopFoods = [
        { foodName: 'Cà phê muối', totalQuantity: 45, totalRevenue: 1575000 },
        { foodName: 'Espresso', totalQuantity: 30, totalRevenue: 960000 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockTopFoods);
      const result = await service.getTopFoods(5);
      expect(result.length).toBe(2);
      expect(result[0].foodName).toBe('Cà phê muối');
    });
  });

  describe('getRevenue', () => {
    it('should query order aggregation for revenue by date range', async () => {
      const mockDailyRevenue = [
        { _id: '2026-08-30', revenue: 2500000, orders: 10 },
        { _id: '2026-08-31', revenue: 3500000, orders: 14 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockDailyRevenue);
      const result = await service.getRevenue('2026-08-30', '2026-08-31');
      expect(result).toEqual(mockDailyRevenue);
    });
  });

  describe('getHourly', () => {
    it('should group revenue by hourly slot for a given date', async () => {
      const mockHourly = [
        { _id: 8, revenue: 500000, orders: 3 },
        { _id: 9, revenue: 800000, orders: 5 },
      ];
      orderModelMock.aggregate.mockResolvedValueOnce(mockHourly);
      const result = await service.getHourly('2026-08-31');
      expect(result).toEqual(mockHourly);
    });
  });
});
