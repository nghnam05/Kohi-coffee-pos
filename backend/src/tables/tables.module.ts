import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TablesService } from './tables.service.js';
import { TablesController } from './tables.controller.js';
import { Table, TableSchema } from './schemas/table.schema.js';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema.js';
import { Order, OrderSchema } from '../orders/schemas/order.schema.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: Reservation.name, schema: ReservationSchema },
      { name: Order.name, schema: OrderSchema },
    ]),
    forwardRef(() => OrdersModule),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
