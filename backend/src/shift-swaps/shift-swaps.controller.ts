import {
  Controller, Get, Post, Patch, Body, Param, Request, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShiftSwapsService } from './shift-swaps.service.js';
import { CreateShiftSwapDto } from './dto/create-shift-swap.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(AuthGuard('jwt'))
@Controller('shift-swaps')
export class ShiftSwapsController {
  constructor(private readonly shiftSwapsService: ShiftSwapsService) {}

  /** POST /api/v1/shift-swaps – Nhân viên tạo yêu cầu đổi ca */
  @Post()
  create(@Request() req: any, @Body() dto: CreateShiftSwapDto) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.shiftSwapsService.create(userId, dto);
  }

  /** GET /api/v1/shift-swaps/my – Nhân viên xem yêu cầu của mình */
  @Get('my')
  findMy(@Request() req: any) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.shiftSwapsService.findMy(userId);
  }

  /** GET /api/v1/shift-swaps – Admin xem tất cả yêu cầu */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get()
  findAll() {
    return this.shiftSwapsService.findAll();
  }

  /** PATCH /api/v1/shift-swaps/:id/status – Admin duyệt / từ chối */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: 'approved' | 'rejected',
    @Request() req: any,
  ) {
    const adminId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.shiftSwapsService.updateStatus(id, status, adminId);
  }
}
