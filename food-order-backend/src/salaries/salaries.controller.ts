import {
  Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalariesService } from './salaries.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  // ── Config ────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('config')
  getConfigs() { return this.salariesService.getConfigs(); }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('config/:userId')
  upsertConfig(@Param('userId') userId: string, @Body() body: any) {
    return this.salariesService.upsertConfig(userId, body);
  }

  // ── Payroll ────────────────────────────────────────────────────────────────────

  /** POST /api/v1/salaries/payroll/generate */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('payroll/generate')
  generate(
    @Body('userId') userId: string,
    @Body('month') month: number,
    @Body('year') year: number,
  ) {
    return this.salariesService.generatePayroll(userId, month, year);
  }

  /** GET /api/v1/salaries/payroll/my */
  @Get('payroll/my')
  findMyPayrolls(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.salariesService.findMyPayrolls(
      userId,
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  /** GET /api/v1/salaries/payroll */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('payroll')
  findPayrolls(@Query('month') month?: string, @Query('year') year?: string) {
    return this.salariesService.findPayrolls(
      month ? Number(month) : undefined,
      year ? Number(year) : undefined,
    );
  }

  /** PATCH /api/v1/salaries/payroll/:id */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id')
  updatePayroll(@Param('id') id: string, @Body() body: any) {
    return this.salariesService.updatePayroll(id, body);
  }

  /** PATCH /api/v1/salaries/payroll/:id/confirm */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.salariesService.confirmPayroll(id);
  }

  /** PATCH /api/v1/salaries/payroll/:id/pay */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id/pay')
  markPaid(@Param('id') id: string, @Body('paidMethod') paidMethod: string) {
    return this.salariesService.markPaid(id, paidMethod || 'cash');
  }
}
