import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CouponsService } from './coupons.service.js';
import { CreateCouponDto } from './dto/create-coupon.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Post()
  create(@Body() dto: CreateCouponDto) { return this.couponsService.create(dto); }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get()
  findAll() { return this.couponsService.findAll(); }

  /** GET /api/v1/coupons/validate/:code?amount=xxx – Public */
  @Get('validate/:code')
  validate(
    @Param('code') code: string,
    @Query('amount') amount: string,
  ) {
    return this.couponsService.validate(code, Number(amount) || 0);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateCouponDto>) {
    return this.couponsService.update(id, dto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) { return this.couponsService.remove(id); }
}
