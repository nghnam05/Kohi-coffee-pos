import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersGateway } from './orders.gateway.js';
import { FoodsService } from '../foods/foods.service.js';
import { TablesService } from '../tables/tables.service.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly ordersGateway: OrdersGateway,
    private readonly foodsService: FoodsService,
    private readonly tablesService: TablesService,
  ) {}

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    let totalAmount = 0;

    // Tính toán lại tổng tiền từ DB (để chống gian lận giá từ frontend)
    for (const item of createOrderDto.items) {
      const food = await this.foodsService.findOne(item.foodId);
      totalAmount += food.price * item.quantity;
    }

    const newOrder = new this.orderModel({
      ...createOrderDto,
      totalAmount,
    });

    const savedOrder = await newOrder.save();

    // Populate dữ liệu liên quan để trả về client và phát tín hiệu qua Socket
    const populatedOrder = await this.orderModel
      .findById(savedOrder._id)
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (populatedOrder) {
      this.ordersGateway.emitNewOrder(populatedOrder);
      return populatedOrder;
    }

    return savedOrder;
  }

  async findAll(status?: string): Promise<any[]> {
    const filter = status ? { status } : {};
    return this.orderModel
      .find(filter)
      .populate('tableId')
      .populate('items.foodId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any;
  }

  async findOne(id: string): Promise<any> {
    const order = await this.orderModel
      .findById(id)
      .populate('tableId')
      .populate('items.foodId')
      .lean()
      .exec();

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }
    return order;
  }

  async findByTable(tableId: string): Promise<any[]> {
    return this.orderModel
      .find({
        tableId,
        status: { $ne: 'cancelled' },
      })
      .populate('tableId')
      .populate('items.foodId')
      .sort({ createdAt: -1 })
      .lean()
      .exec() as any;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto): Promise<OrderDocument> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { status: updateOrderStatusDto.status },
        { new: true }
      )
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    this.ordersGateway.emitStatusUpdate(id, updateOrderStatusDto.status);
    return updatedOrder;
  }

  async transferTable(fromTableId: string, toTableId: string): Promise<any> {
    // 1. Tìm các đơn hàng chưa hoàn tất hoặc đã xong món nhưng chưa thanh toán
    const activeOrders = await this.orderModel.find({
      tableId: fromTableId,
      status: { $nin: ['paid', 'cancelled'] },
    });

    if (activeOrders.length === 0) {
      throw new NotFoundException('Không tìm thấy đơn hàng đang hoạt động nào ở bàn này.');
    }

    // 2. Cập nhật ID bàn mới cho tất cả các đơn hàng hoạt động đó
    await this.orderModel.updateMany(
      { tableId: fromTableId, status: { $nin: ['paid', 'cancelled'] } },
      { tableId: toTableId },
    );

    // 3. Cập nhật trạng thái hoạt động của 2 bàn thông qua TablesService
    await this.tablesService.update(fromTableId, { status: 'empty' });
    await this.tablesService.update(toTableId, { status: 'serving' });

    // 4. Phát tín hiệu qua Socket để các màn hình Dashboard của admin/nhân viên và khách cập nhật lại real-time
    if (this.ordersGateway.server) {
      this.ordersGateway.server.emit('tableTransferred', { fromTableId, toTableId });
    }

    return { message: 'Chuyển bàn thành công', fromTableId, toTableId };
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedOrder = await this.orderModel.findByIdAndDelete(id).exec();
    if (!deletedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }
    this.ordersGateway.emitOrderDeleted(id);
    return { message: `Đã xóa đơn hàng ${id} thành công.` };
  }
}
