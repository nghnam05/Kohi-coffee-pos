import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { StaffCallsController } from './staff-calls.controller.js';
import { StaffCallsService } from './staff-calls.service.js';
import { StaffCall, StaffCallSchema } from './schemas/staff-call.schema.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: StaffCall.name, schema: StaffCallSchema },
    ]),
    // Import OrdersModule để dùng OrdersGateway (socket)
    OrdersModule,
  ],
  controllers: [StaffCallsController],
  providers: [StaffCallsService],
})
export class StaffCallsModule {}
