import { Test, TestingModule } from '@nestjs/testing';
import { AnalyticsService } from '../../src/analytics/analytics.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../../src/orders/schemas/order.schema';
import { Payroll } from '../../src/salaries/schemas/payroll.schema';

describe('AnalyticsService', () => {
  let service: AnalyticsService;
  let orderModelMock: any;
  let payrollModelMock: any;

  beforeEach(async () => {
    orderModelMock = {
      countDocuments: jest.fn().mockResolvedValue(15),
      aggregate: jest.fn().mockResolvedValue([{ total: 5000000 }]),
    };

    payrollModelMock = {
      aggregate: jest.fn().mockResolvedValue([{ total: 1200000 }]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AnalyticsService,
        { provide: getModelToken(Order.name), useValue: orderModelMock },
        { provide: getModelToken(Payroll.name), useValue: payrollModelMock },
      ],
    }).compile();

    service = module.get<AnalyticsService>(AnalyticsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSummary', () => {
    it('should calculate gross revenue, salaries, and net income', async () => {
      const result = await service.getSummary();
      expect(result).toBeDefined();
      expect(result.todayGross).toBe(5000000);
      expect(result.todaySalary).toBe(1200000);
      expect(result.today).toBe(3800000);
      expect(result.totalOrders).toBe(15);
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
});
