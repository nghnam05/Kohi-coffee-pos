import { Test, TestingModule } from '@nestjs/testing';
import { CouponsService } from './coupons.service';
import { getModelToken } from '@nestjs/mongoose';
import { Coupon } from './schemas/coupon.schema';

describe('CouponsService', () => {
  let service: CouponsService;
  let couponModelMock: any;

  const mockPercentCoupon = {
    _id: 'coupon1',
    code: 'KOHI10',
    type: 'percent',
    value: 10,
    maxDiscount: 30000,
    minOrderAmount: 50000,
    maxUsage: 100,
    usedCount: 10,
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
  };

  const mockFixedCoupon = {
    _id: 'coupon2',
    code: 'DISCOUNT50K',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderAmount: 100000,
    maxUsage: 50,
    usedCount: 5,
    expiresAt: new Date(Date.now() + 86400000),
    isActive: true,
  };

  beforeEach(async () => {
    couponModelMock = {
      countDocuments: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockPercentCoupon, mockFixedCoupon]),
      }),
      findOne: jest.fn().mockImplementation(({ code }) => ({
        exec: jest.fn().mockResolvedValue(
          code === 'KOHI10' ? mockPercentCoupon : code === 'DISCOUNT50K' ? mockFixedCoupon : null,
        ),
      })),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPercentCoupon),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPercentCoupon),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        {
          provide: getModelToken(Coupon.name),
          useValue: couponModelMock,
        },
      ],
    }).compile();

    service = module.get<CouponsService>(CouponsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validate', () => {
    it('should return invalid if code does not exist', async () => {
      const result = await service.validate('INVALID_CODE', 100000);
      expect(result.valid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    it('should return invalid if order amount is below minOrderAmount', async () => {
      const result = await service.validate('KOHI10', 30000); // min is 50,000
      expect(result.valid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    it('should calculate percent discount correctly with maxDiscount cap', async () => {
      const result = await service.validate('KOHI10', 500000); // 10% of 500k = 50k, but max is 30k
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(30000);
    });

    it('should calculate fixed discount correctly', async () => {
      const result = await service.validate('DISCOUNT50K', 150000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(50000);
    });
  });

  describe('incrementUsage', () => {
    it('should call updateOne with $inc usedCount', async () => {
      await service.incrementUsage('KOHI10');
      expect(couponModelMock.updateOne).toHaveBeenCalledWith(
        { code: 'KOHI10' },
        { $inc: { usedCount: 1 } },
      );
    });
  });
});
