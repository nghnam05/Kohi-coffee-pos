import {
  Controller, Post, Patch, Get, Param, Body, Request, Query, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AttendanceService } from './attendance.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(AuthGuard('jwt'))
@Controller('attendance')
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  /** POST /api/v1/attendance/check-in */
  @Post('check-in')
  checkIn(@Request() req: any) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.attendanceService.checkIn(userId);
  }

  /** PATCH /api/v1/attendance/check-out */
  @Patch('check-out')
  checkOut(@Request() req: any) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.attendanceService.checkOut(userId);
  }

  /** GET /api/v1/attendance/my?month=&year= – Nhân viên xem của mình */
  @Get('my')
  findMy(
    @Request() req: any,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const userId = req.user?.userId || req.user?._id || req.user?.sub;
    return this.attendanceService.findMyAttendance(userId, month, year);
  }

  /** GET /api/v1/attendance/summary?userId=&month=&year= – Admin */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Get('summary')
  getSummary(
    @Query('userId') userId: string,
    @Query('month') month: string,
    @Query('year') year: string,
  ) {
    return this.attendanceService.getMonthlySummary(userId, month, year);
  }

  /** GET /api/v1/attendance?userId=&month=&year= – Admin */
  @UseGuards(RolesGuard)
  @Roles('admin', 'staff')
  @Get()
  findAll(
    @Query('userId') userId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.attendanceService.findAll(userId, month, year);
  }

  /** PATCH /api/v1/attendance/:id – Admin chỉnh thủ công */
  @UseGuards(RolesGuard)
  @Roles('admin')
  @Patch(':id')
  adminEdit(
    @Param('id') id: string,
    @Body('checkIn') checkIn: string,
    @Body('checkOut') checkOut: string,
    @Body('note') note?: string,
  ) {
    return this.attendanceService.adminEdit(id, checkIn, checkOut, note);
  }
}
