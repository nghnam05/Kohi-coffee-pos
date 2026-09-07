import {
  Controller, Get, Post, Patch, Param, Body, Query, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SalariesService, CalculatePeriodParams } from './salaries.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('salaries')
export class SalariesController {
  constructor(private readonly salariesService: SalariesService) {}

  // ── Config ────────────────────────────────────────────────────────────────────

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('config')
  getConfigs() {
    return this.salariesService.getConfigs();
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('config/:userId')
  getConfigByUser(@Param('userId') userId: string) {
    return this.salariesService.getConfigByUser(userId);
  }

  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('config/:userId')
  upsertConfig(@Param('userId') userId: string, @Body() body: any) {
    return this.salariesService.upsertConfig(userId, body);
  }

  // ── Payroll ────────────────────────────────────────────────────────────────────

  /** POST /api/v1/salaries/payroll/preview - Xem trước tính lương kỳ (giờ/ngày/tuần/tháng) */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('payroll/preview')
  previewPayroll(@Body() params: any) {
    return this.salariesService.calculatePeriodPreview(params);
  }

  /** POST /api/v1/salaries/payroll/generate-period - Tạo phiếu lương kỳ chính thức */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Post('payroll/generate-period')
  generatePeriodPayroll(@Body() body: any) {
    return this.salariesService.generatePeriodPayroll(body);
  }

  /** POST /api/v1/salaries/payroll/generate - Tương thích ngược tháng cũ */
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

  /** GET /api/v1/salaries/payroll/my - Nhân viên xem phiếu lương của chính mình */
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

  /** GET /api/v1/salaries/payroll - Quản lý xem danh sách tất cả phiếu lương */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('payroll')
  findPayrolls(
    @Query('periodType') periodType?: string,
    @Query('status') status?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('userId') userId?: string,
  ) {
    return this.salariesService.findPayrolls({
      periodType,
      status,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
      userId,
    });
  }

  /** GET /api/v1/salaries/payroll/:id - Chi tiết 1 phiếu lương */
  @Get('payroll/:id')
  getPayrollById(@Param('id') id: string) {
    return this.salariesService.getPayrollById(id);
  }

  /** PATCH /api/v1/salaries/payroll/:id - Điều chỉnh thưởng, phạt, ghi chú */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id')
  updatePayroll(@Param('id') id: string, @Body() body: any) {
    return this.salariesService.updatePayroll(id, body);
  }

  /** PATCH /api/v1/salaries/payroll/:id/confirm - Duyệt phiếu lương */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id/confirm')
  confirm(@Param('id') id: string) {
    return this.salariesService.confirmPayroll(id);
  }

  /** PATCH /api/v1/salaries/payroll/:id/pay - Xác nhận thanh toán tiền mặt/chuyển khoản & khóa ca */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch('payroll/:id/pay')
  markPaid(
    @Param('id') id: string,
    @Body('paidMethod') paidMethod: string,
    @Body('paymentRef') paymentRef?: string,
  ) {
    return this.salariesService.markPaid(id, paidMethod || 'cash', paymentRef);
  }
}
