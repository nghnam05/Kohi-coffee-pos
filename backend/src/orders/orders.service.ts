import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersGateway } from './orders.gateway.js';
import { FoodsService } from '../foods/foods.service.js';
import { TablesService } from '../tables/tables.service.js';
import { CouponsService } from '../coupons/coupons.service.js';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly ordersGateway: OrdersGateway,
    private readonly foodsService: FoodsService,
    private readonly tablesService: TablesService,
    private readonly couponsService: CouponsService,
  ) {}

  onModuleInit() {
    // Đơn hàng đã thanh toán được lưu vết lại trong DB để phục vụ truy vấn lịch sử & thống kê doanh thu
  }

  async cleanupExpiredPaidOrders() {
    // Lưu lịch sử vào DB để phục vụ thống kê doanh thu cho admin
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    let totalAmount = 0;

    // Tính toán lại tổng tiền từ DB (để chống gian lận giá từ frontend)
    for (const item of createOrderDto.items) {
      const food = await this.foodsService.findOne(item.foodId);
      totalAmount += food.price * item.quantity;
    }

    // Áp dụng mã giảm giá nếu có
    let discountAmount = 0;
    let couponCode: string | null = null;
    if (createOrderDto.couponCode) {
      const couponResult = await this.couponsService.validate(createOrderDto.couponCode, totalAmount);
      if (!couponResult.valid) {
        throw new BadRequestException(couponResult.message || 'Mã giảm giá không hợp lệ.');
      }
      discountAmount = couponResult.discountAmount;
      couponCode = createOrderDto.couponCode.toUpperCase();
    }

    const finalAmount = Math.max(0, totalAmount - discountAmount);
    const isTakeaway = createOrderDto.isTakeaway ?? !createOrderDto.tableId;

    const newOrder = new this.orderModel({
      ...createOrderDto,
      isTakeaway,
      totalAmount: finalAmount,
      discountAmount,
      couponCode,
    });

    const savedOrder = await newOrder.save();

    // Tăng usedCount sau khi order được lưu thành công
    if (couponCode) {
      await this.couponsService.incrementUsage(couponCode);
    }

    // Cập nhật trạng thái bàn ăn sang 'serving' (có khách)
    if (createOrderDto.tableId) {
      await this.tablesService.update(createOrderDto.tableId, { status: 'serving' }).catch(() => {});
    }

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
    const updatePayload: any = { status: updateOrderStatusDto.status };
    if (updateOrderStatusDto.status === 'paid') {
      updatePayload.paymentStatus = 'paid';
      updatePayload.paidAt = new Date();
    }

    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        updatePayload,
        { new: true }
      )
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    this.ordersGateway.emitStatusUpdate(id, updateOrderStatusDto.status);

    // Tự động giải phóng bàn về 'empty' nếu không còn đơn hàng active nào khác
    if (updateOrderStatusDto.status === 'paid' || updateOrderStatusDto.status === 'cancelled') {
      const tableId = (updatedOrder.tableId as any)?._id || updatedOrder.tableId;
      if (tableId) {
        const remainingActiveOrders = await this.orderModel.countDocuments({
          tableId,
          _id: { $ne: id },
          status: { $nin: ['paid', 'cancelled'] },
        });
        if (remainingActiveOrders === 0) {
          await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
        }
      }
    }

    if (updateOrderStatusDto.status === 'paid') {
      console.log(`[Payment Completed] Đơn hàng ${id} đã thanh toán thành công và lưu vết vào DB.`);
    }

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

    // Tự động giải phóng bàn nếu không còn đơn hàng active nào khác
    if (deletedOrder.tableId) {
      const tableId = (deletedOrder.tableId as any)?._id || deletedOrder.tableId;
      const remainingActiveOrders = await this.orderModel.countDocuments({
        tableId,
        status: { $nin: ['paid', 'cancelled'] },
      });
      if (remainingActiveOrders === 0) {
        await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
      }
    }

    return { message: `Đã xóa đơn hàng ${id} thành công.` };
  }

  async mergeTableOrders(tableId: string): Promise<any> {
    const activeOrders = await this.orderModel.find({
      tableId,
      status: { $nin: ['paid', 'cancelled'] },
      paymentStatus: { $ne: 'paid' },
    }).sort({ createdAt: 1 }).exec();

    if (activeOrders.length < 2) {
      throw new BadRequestException('Bàn này cần tối thiểu 2 đơn hàng đang hoạt động để gộp.');
    }

    const primaryOrder = activeOrders[0];
    const secondaryOrders = activeOrders.slice(1);

    const mergedItems = [...primaryOrder.items];

    for (const secOrder of secondaryOrders) {
      for (const item of secOrder.items) {
        const existingItemIndex = mergedItems.findIndex(
          (mItem) =>
            mItem.foodId.toString() === item.foodId.toString() &&
            (mItem.note || '') === (item.note || '')
        );

        if (existingItemIndex > -1) {
          mergedItems[existingItemIndex].quantity += item.quantity;
        } else {
          mergedItems.push(item);
        }
      }
    }

    let newTotalAmount = 0;
    for (const item of mergedItems) {
      const food = await this.foodsService.findOne(item.foodId.toString());
      newTotalAmount += (food.price || 0) * item.quantity;
    }

    primaryOrder.items = mergedItems;
    primaryOrder.totalAmount = newTotalAmount;
    await primaryOrder.save();

    const secondaryIds = secondaryOrders.map((o) => o._id);
    await this.orderModel.deleteMany({ _id: { $in: secondaryIds } });

    if (this.ordersGateway.server) {
      this.ordersGateway.server.emit('ordersMerged', { tableId, primaryOrderId: primaryOrder._id });
    }

    return {
      message: 'Gộp đơn thành công',
      primaryOrder,
      mergedCount: secondaryOrders.length + 1,
    };
  }
}
