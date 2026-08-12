import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TablesService } from './tables.service.js';
import { TablesController } from './tables.controller.js';
import { Table, TableSchema } from './schemas/table.schema.js';
import { Reservation, ReservationSchema } from '../reservations/schemas/reservation.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Table.name, schema: TableSchema },
      { name: Reservation.name, schema: ReservationSchema },
    ]),
  ],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
