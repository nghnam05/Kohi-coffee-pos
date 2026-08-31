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
  Req,
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

  @Post()
  async createOrder(@Body() createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    return this.ordersService.createOrder(createOrderDto);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get()
  async findAll(@Query('status') status?: string): Promise<OrderDocument[]> {
    return this.ordersService.findAll(status);
  }

  @Get('table/:tableId')
  async findByTable(
    @Param('tableId') tableId: string,
    @Query('activeOnly') activeOnly?: string,
  ): Promise<OrderDocument[]> {
    return this.ordersService.findByTable(tableId, activeOnly === 'true');
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.findOne(id);
  }

  @Patch('transfer-table')
  async transferTable(
    @Body('fromTableId') fromTableId: string,
    @Body('toTableId') toTableId: string,
  ): Promise<any> {
    return this.ordersService.transferTable(fromTableId, toTableId);
  }

  @Patch('merge-table/:tableId')
  async mergeTableOrders(@Param('tableId') tableId: string): Promise<any> {
    return this.ordersService.mergeTableOrders(tableId);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateOrderStatusDto: UpdateOrderStatusDto,
    @Req() req: any,
  ): Promise<OrderDocument> {
    return this.ordersService.updateStatus(id, updateOrderStatusDto, req.user?.role);
  }

  @Patch(':id/notify-payment')
  async notifyPayment(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.notifyPayment(id);
  }

  @Patch(':id/pay')
  async simulatePayment(@Param('id') id: string): Promise<OrderDocument> {
    return this.ordersService.updateStatus(id, { status: 'paid' });
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff', 'user', 'manager', 'cashier')
  @Delete('bulk')
  async removeBulk(@Body('ids') ids: string[]): Promise<{ message: string; deletedCount: number }> {
    return this.ordersService.removeBulk(ids);
  }

  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff', 'user', 'manager', 'cashier')
  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any): Promise<{ message: string }> {
    return this.ordersService.remove(id, req.user?.role);
  }
}
