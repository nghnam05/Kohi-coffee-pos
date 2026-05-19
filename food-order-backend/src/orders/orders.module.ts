import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service.js';
import { OrdersController } from './orders.controller.js';
import { Order, OrderSchema } from './schemas/order.schema.js';
import { OrdersGateway } from './orders.gateway.js';
import { FoodsModule } from '../foods/foods.module.js';
import { TablesModule } from '../tables/tables.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Order.name, schema: OrderSchema }]),
    FoodsModule, // Nhập FoodsModule để sử dụng FoodsService tính tổng tiền
    TablesModule, // Nhập TablesModule để sử dụng TablesService đổi bàn
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersGateway],
  exports: [OrdersService],
})
export class OrdersModule {}
