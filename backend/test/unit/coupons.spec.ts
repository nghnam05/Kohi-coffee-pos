import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CouponsService } from '../../src/coupons/coupons.service';
import { getModelToken } from '@nestjs/mongoose';
import { Coupon } from '../../src/coupons/schemas/coupon.schema';

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

  const mockExpiredCoupon = {
    _id: 'coupon3',
    code: 'EXPIRED',
    type: 'percent',
    value: 20,
    maxDiscount: 50000,
    minOrderAmount: 50000,
    maxUsage: 100,
    usedCount: 5,
    expiresAt: new Date(Date.now() - 86400000),
    isActive: true,
  };

  const mockExhaustedCoupon = {
    _id: 'coupon4',
    code: 'MAXED',
    type: 'percent',
    value: 15,
    maxDiscount: 20000,
    minOrderAmount: 50000,
    maxUsage: 10,
    usedCount: 10,
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
          code === 'KOHI10' ? mockPercentCoupon :
          code === 'DISCOUNT50K' ? mockFixedCoupon :
          code === 'EXPIRED' ? mockExpiredCoupon :
          code === 'MAXED' ? mockExhaustedCoupon :
          null,
        ),
      })),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockPercentCoupon) }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockPercentCoupon) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CouponsService,
        { provide: getModelToken(Coupon.name), useValue: couponModelMock },
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
      const result = await service.validate('KOHI10', 30000);
      expect(result.valid).toBe(false);
      expect(result.discountAmount).toBe(0);
    });

    it('should return invalid if coupon has expired', async () => {
      const result = await service.validate('EXPIRED', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toBeDefined();
      expect(result.discountAmount).toBe(0);
    });

    it('should return invalid if coupon maxUsage has been reached', async () => {
      const result = await service.validate('MAXED', 100000);
      expect(result.valid).toBe(false);
      expect(result.message).toContain('hết lượt sử dụng');
    });

    it('should calculate percent discount correctly with maxDiscount cap', async () => {
      const result = await service.validate('KOHI10', 500000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(30000);
    });

    it('should calculate percent discount without exceeding maxDiscount', async () => {
      const result = await service.validate('KOHI10', 100000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(10000);
    });

    it('should calculate fixed discount correctly', async () => {
      const result = await service.validate('DISCOUNT50K', 150000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBe(50000);
    });

    it('should cap fixed discount at orderAmount if fixed value > orderAmount', async () => {
      const result = await service.validate('DISCOUNT50K', 110000);
      expect(result.valid).toBe(true);
      expect(result.discountAmount).toBeLessThanOrEqual(110000);
    });
  });

  describe('incrementUsage', () => {
    it('should call updateOne with $inc usedCount by 1', async () => {
      await service.incrementUsage('KOHI10');
      expect(couponModelMock.updateOne).toHaveBeenCalledWith(
        { code: 'KOHI10' },
        { $inc: { usedCount: 1 } },
      );
    });

    it('should uppercase the coupon code before querying', async () => {
      await service.incrementUsage('kohi10');
      expect(couponModelMock.updateOne).toHaveBeenCalledWith(
        { code: 'KOHI10' },
        { $inc: { usedCount: 1 } },
      );
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if coupon does not exist', async () => {
      couponModelMock.findByIdAndUpdate.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('nonexistent', { value: 20 })).rejects.toThrow(NotFoundException);
    });

    it('should update and return the updated coupon', async () => {
      const result = await service.update('coupon1', { value: 15 });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if coupon does not exist', async () => {
      couponModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return success message after deletion', async () => {
      const result = await service.remove('coupon1');
      expect(result.message).toBeDefined();
    });
  });
});
