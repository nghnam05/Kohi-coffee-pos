import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller.js';
import { AnalyticsService } from './analytics.service.js';
import { Order, OrderSchema } from '../orders/schemas/order.schema.js';
import { Payroll, PayrollSchema } from '../salaries/schemas/payroll.schema.js';
import { Ingredient, IngredientSchema } from '../ingredients/schemas/ingredient.schema.js';
import { Attendance, AttendanceSchema } from '../attendance/schemas/attendance.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema },
      { name: Payroll.name, schema: PayrollSchema },
      { name: Ingredient.name, schema: IngredientSchema },
      { name: Attendance.name, schema: AttendanceSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
