import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { OrderDocument } from './schemas/order.schema.js';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // POST /api/v1/orders (Cho phép Khách hàng truy cập tự do)
  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    return this.ordersService.createOrder(createOrderDto);
  }

  // GET /api/v1/orders (Chỉ cho phép Admin và Staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Get()
  async findAll(@Query('status') status?: string): Promise<OrderDocument[]> {
    return this.ordersService.findAll(status);
  }

  // GET /api/v1/orders/:id (Chỉ cho phép Admin và Staff)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.findOne(id);
  }

  // GET /api/v1/orders/table/:tableId (Truy cập tự do để khách quét QR có thể thấy đơn hàng của họ)
  @Get('table/:tableId')
  async findByTable(@Param('tableId') tableId: string): Promise<OrderDocument[]> {
    return this.ordersService.findByTable(tableId);
  }

  // PATCH /api/v1/orders/:id/status (Chỉ cho phép Admin và Staff cập nhật trạng thái)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
  ): Promise<OrderDocument> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto);
  }

  // PATCH /api/v1/orders/transfer-table (Cho phép Khách hàng và Staff/Admin thực hiện đổi bàn)
  @Patch('transfer-table')
  async transferTable(
    @Body('fromTableId') fromTableId: string,
    @Body('toTableId') toTableId: string,
  ): Promise<any> {
    return this.ordersService.transferTable(fromTableId, toTableId);
  }

  // PATCH /api/v1/orders/merge-table/:tableId (Cho phép gộp tất cả đơn active cùng 1 bàn làm 1)
  @Patch('merge-table/:tableId')
  async mergeTableOrders(@Param('tableId') tableId: string): Promise<any> {
    return this.ordersService.mergeTableOrders(tableId);
  }

  // PATCH /api/v1/orders/:id/pay (Truy cập tự do để giả lập webhook thanh toán MoMo/VietQR)
  @Patch(':id/pay')
  async simulatePayment(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.updateStatus(id, { status: 'paid' });
  }

  // DELETE /api/v1/orders/:id (Chỉ cho phép Admin xóa đơn hàng)
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'staff')
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<{ message: string }> {
    return this.ordersService.remove(id);
  }
}
