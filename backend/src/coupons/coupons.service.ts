import {
  Injectable, NotFoundException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument } from './schemas/coupon.schema.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';

import { OnModuleInit } from '@nestjs/common';

@Injectable()
export class CouponsService implements OnModuleInit {
  constructor(
    @InjectModel(Coupon.name) private readonly couponModel: Model<CouponDocument>,
  ) {}

  async onModuleInit() {
    const count = await this.couponModel.countDocuments();
    if (count === 0) {
      await this.couponModel.insertMany([
        {
          code: 'KOHI10',
          type: 'percent',
          value: 10,
          maxDiscount: 30000,
          minOrderAmount: 50000,
          maxUsage: 100,
          usedCount: 12,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: 'KOHI20',
          type: 'percent',
          value: 20,
          maxDiscount: 50000,
          minOrderAmount: 100000,
          maxUsage: 50,
          usedCount: 5,
          expiresAt: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
        {
          code: 'WELCOME50K',
          type: 'fixed',
          value: 50000,
          maxDiscount: 50000,
          minOrderAmount: 150000,
          maxUsage: 200,
          usedCount: 28,
          expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          isActive: true,
        },
      ]);
      console.log('[Seed] Default Coupon Codes initialized in Database.');
    }
  }

  async create(dto: CreateCouponDto): Promise<CouponDocument> {
    const coupon = new this.couponModel({ ...dto, code: dto.code.toUpperCase() });
    return coupon.save();
  }

  async findAll(): Promise<CouponDocument[]> {
    return this.couponModel.find().sort({ createdAt: -1 }).exec();
  }

  /**
   * Validate mã giảm giá và trả về số tiền được giảm.
   * Không tăng usedCount ở đây – chỉ tăng khi order được tạo thành công.
   */
  async validate(code: string, orderAmount: number): Promise<{
    valid: boolean;
    discountAmount: number;
    coupon?: CouponDocument;
    message?: string;
  }> {
    const coupon = await this.couponModel.findOne({
      code: code.toUpperCase(),
      isActive: true,
    }).exec();

    if (!coupon) return { valid: false, discountAmount: 0, message: 'Mã giảm giá không tồn tại hoặc đã bị vô hiệu.' };
    if (new Date() > coupon.expiresAt) return { valid: false, discountAmount: 0, message: 'Mã giảm giá đã hết hạn.' };
    if (coupon.maxUsage > 0 && coupon.usedCount >= coupon.maxUsage) {
      return { valid: false, discountAmount: 0, message: 'Mã giảm giá đã đạt giới hạn sử dụng.' };
    }
    if (coupon.minOrderAmount > 0 && orderAmount < coupon.minOrderAmount) {
      return {
        valid: false, discountAmount: 0,
        message: `Đơn hàng tối thiểu ${coupon.minOrderAmount.toLocaleString('vi-VN')}đ để dùng mã này.`,
      };
    }

    let discountAmount = 0;
    if (coupon.type === 'percent') {
      discountAmount = Math.round((orderAmount * coupon.value) / 100);
      if (coupon.maxDiscount > 0) discountAmount = Math.min(discountAmount, coupon.maxDiscount);
    } else {
      discountAmount = Math.min(coupon.value, orderAmount);
    }

    return { valid: true, discountAmount, coupon };
  }

  /** Tăng usedCount sau khi order tạo thành công */
  async incrementUsage(code: string): Promise<void> {
    await this.couponModel.updateOne(
      { code: code.toUpperCase() },
      { $inc: { usedCount: 1 } },
    );
  }

  async update(id: string, dto: Partial<CreateCouponDto>): Promise<CouponDocument> {
    const updated = await this.couponModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) throw new NotFoundException('Không tìm thấy mã giảm giá.');
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.couponModel.findByIdAndDelete(id).exec();
    if (!deleted) throw new NotFoundException('Không tìm thấy mã giảm giá.');
    return { message: 'Đã xóa mã giảm giá.' };
  }
}
