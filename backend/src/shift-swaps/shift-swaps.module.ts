import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ShiftSwapRequest, ShiftSwapRequestSchema } from './schemas/shift-swap.schema.js';
import { User, UserSchema } from '../users/schemas/user.schema.js';
import { ShiftSwapsService } from './shift-swaps.service.js';
import { ShiftSwapsController } from './shift-swaps.controller.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ShiftSwapRequest.name, schema: ShiftSwapRequestSchema },
      { name: User.name, schema: UserSchema },
    ]),
    OrdersModule,
  ],
  controllers: [ShiftSwapsController],
  providers: [ShiftSwapsService],
  exports: [ShiftSwapsService],
})
export class ShiftSwapsModule {}
