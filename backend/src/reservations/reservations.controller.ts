import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReservationsService } from './reservations.service.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // POST /api/v1/reservations (Public - Khách hàng tự đặt bàn trên trang chủ)
  @Post()
  create(@Body() dto: CreateReservationDto) {
    return this.reservationsService.create(dto);
  }

  // GET /api/v1/reservations/lookup?phone=... (Public - Khách hàng tự tra cứu đơn đặt bàn của mình)
  @Get('lookup')
  lookupByPhone(@Query('phone') phone: string) {
    return this.reservationsService.findByPhone(phone || '');
  }

  // PATCH /api/v1/reservations/:id/customer-cancel (Public - Khách hàng tự hủy đơn đặt bàn của mình)
  @Patch(':id/customer-cancel')
  customerCancel(@Param('id') id: string) {
    return this.reservationsService.customerCancel(id);
  }

  // GET /api/v1/reservations (Cho phép Admin và Staff xem danh sách đặt bàn)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get()
  findAll(@Query('status') status?: string) {
    return this.reservationsService.findAll(status);
  }

  // GET /api/v1/reservations/:id
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.reservationsService.findOne(id);
  }

  // PATCH /api/v1/reservations/:id/status (Admin & Staff cập nhật trạng thái: confirmed, arrived, cancelled)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
  ) {
    return this.reservationsService.updateStatus(id, status);
  }

  // DELETE /api/v1/reservations/:id (Admin & Staff xóa đơn đặt bàn)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reservationsService.remove(id);
  }
}
