import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CouponsController } from './coupons.controller.js';
import { CouponsService } from './coupons.service.js';
import { Coupon, CouponSchema } from './schemas/coupon.schema.js';

@Module({
  imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])],
  controllers: [CouponsController],
  providers: [CouponsService],
  exports: [CouponsService],
})
export class CouponsModule {}
