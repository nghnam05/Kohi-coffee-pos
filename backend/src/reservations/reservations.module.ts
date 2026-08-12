import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ReservationsController } from './reservations.controller.js';
import { ReservationsService } from './reservations.service.js';
import { Reservation, ReservationSchema } from './schemas/reservation.schema.js';
import { TablesModule } from '../tables/tables.module.js';
import { OrdersModule } from '../orders/orders.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Reservation.name, schema: ReservationSchema }]),
    TablesModule,
    OrdersModule,
  ],
  controllers: [ReservationsController],
  providers: [ReservationsService],
  exports: [ReservationsService],
})
export class ReservationsModule {}
