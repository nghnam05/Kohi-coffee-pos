import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { Order, OrderSchema } from './schemas/order.schema.js';
import { OrdersGateway } from './orders.gateway.js';
import { FoodsModule } from '../foods/foods.module.js';
import { TablesModule } from '../tables/tables.module.js';
import { CouponsModule } from '../coupons/coupons.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { PaymentsModule } from '../payments/payments.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    FoodsModule,
    forwardRef(() => TablesModule),
    CouponsModule,
    AuthModule,
    PaymentsModule,
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService, OrdersGateway],
})
export class OrdersModule {}
