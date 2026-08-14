import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffCallsService } from './staff-calls.service.js';
import { CreateStaffCallDto } from './dto/create-staff-call.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

@Controller('staff-calls')
export class StaffCallsController {
  constructor(
    private readonly staffCallsService: StaffCallsService,
    private readonly ordersGateway: OrdersGateway,
  ) {}

  /**
   * POST /api/v1/staff-calls
   * Khách gọi nhân viên – truy cập tự do (public)
   */
  @Post()
  async createCall(@Body() dto: CreateStaffCallDto) {
    const call = await this.staffCallsService.createCall(dto);
    // Phát realtime chỉ tới tài khoản nhân viên đang đăng nhập
    this.ordersGateway.emitStaffCall(call);
    return call;
  }

  /**
   * GET /api/v1/staff-calls
   * Lấy danh sách yêu cầu đang chờ – chỉ Nhân viên mới có thông báo/danh sách
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get()
  async findPending(@Req() req: any) {
    // Nếu là tài khoản Admin thì không lấy danh sách thông báo gọi nhân viên
    if (req.user?.role === 'admin') {
      return [];
    }
    return this.staffCallsService.findPending();
  }

  /**
   * PATCH /api/v1/staff-calls/:id/acknowledge
   * Nhân viên xác nhận đã tiếp nhận – chỉ Admin/Staff
   */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Patch(':id/acknowledge')
  async acknowledge(@Param('id') id: string) {
    const updated = await this.staffCallsService.acknowledge(id);
    // Phát realtime để xóa khỏi danh sách chờ của Dashboard nhân viên
    this.ordersGateway.emitStaffCallAcknowledged(updated._id.toString());
    return updated;
  }
}
