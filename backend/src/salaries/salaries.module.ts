import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SalariesController } from './salaries.controller.js';
import { SalariesService } from './salaries.service.js';
import { SalaryConfig, SalaryConfigSchema } from './schemas/salary-config.schema.js';
import { Payroll, PayrollSchema } from './schemas/payroll.schema.js';
import { AttendanceModule } from '../attendance/attendance.module.js';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SalaryConfig.name, schema: SalaryConfigSchema },
      { name: Payroll.name, schema: PayrollSchema },
    ]),
    AttendanceModule, // Dùng AttendanceService để lấy tổng giờ làm
  ],
  controllers: [SalariesController],
  providers: [SalariesService],
})
export class SalariesModule {}
