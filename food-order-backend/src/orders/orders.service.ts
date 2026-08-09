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
    // Tự động kiểm tra và dọn dẹp các đơn hàng đã thanh toán quá 5 phút định kỳ mỗi 30 giây
    setInterval(() => {
      this.cleanupExpiredPaidOrders();
    }, 30000);
  }

  async cleanupExpiredPaidOrders() {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const expiredOrders = await this.orderModel.find({
        $or: [
          { status: 'paid', updatedAt: { $lte: fiveMinutesAgo } },
          { paymentStatus: 'paid', paidAt: { $lte: fiveMinutesAgo } },
          { status: 'paid', paidAt: { $lte: fiveMinutesAgo } },
        ],
      }).exec();

      for (const order of expiredOrders) {
        await this.orderModel.findByIdAndDelete(order._id).exec();
        this.ordersGateway.emitOrderDeleted(order._id.toString());
        console.log(`[Auto-Cleanup] Đã tự động xóa đơn hàng ${order._id} sau 5 phút hoàn tất thanh toán.`);
      }
    } catch (error) {
      console.error('Lỗi khi dọn dẹp đơn hàng đã thanh toán:', error);
    }
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

    const newOrder = new this.orderModel({
      ...createOrderDto,
      totalAmount: finalAmount,
      discountAmount,
      couponCode,
    });

    const savedOrder = await newOrder.save();

    // Tăng usedCount sau khi order được lưu thành công
    if (couponCode) {
      await this.couponsService.incrementUsage(couponCode);
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

    if (updateOrderStatusDto.status === 'paid') {
      setTimeout(async () => {
        try {
          const exists = await this.orderModel.findById(id).exec();
          if (exists && (exists.status === 'paid' || exists.paymentStatus === 'paid')) {
            await this.orderModel.findByIdAndDelete(id).exec();
            this.ordersGateway.emitOrderDeleted(id);
            console.log(`[Timer] Đã tự động xóa đơn hàng ${id} sau 5 phút hoàn tất thanh toán.`);
          }
        } catch (err) {
          console.error(`Lỗi khi tự động xóa đơn hàng ${id}:`, err);
        }
      }, 5 * 60 * 1000);
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

    const combinedItemsMap = new Map<string, { foodId: any; quantity: number; note: string }>();
    let totalAmountCombined = 0;
    let discountAmountCombined = 0;

    for (const order of activeOrders) {
      totalAmountCombined += order.totalAmount || 0;
      discountAmountCombined += order.discountAmount || 0;

      for (const item of order.items) {
        const foodIdStr = item.foodId ? item.foodId.toString() : '';
        const noteStr = (item.note || '').trim();
        const key = `${foodIdStr}___${noteStr}`;

        if (combinedItemsMap.has(key)) {
          const existing = combinedItemsMap.get(key)!;
          existing.quantity += item.quantity;
        } else {
          combinedItemsMap.set(key, {
            foodId: item.foodId,
            quantity: item.quantity,
            note: item.note || '',
          });
        }
      }
    }

    const mergedItems = Array.from(combinedItemsMap.values());

    const statuses = activeOrders.map((o) => o.status);
    let mergedStatus = 'completed';
    if (statuses.includes('pending')) {
      mergedStatus = 'pending';
    } else if (statuses.includes('confirmed') || statuses.includes('cooking')) {
      mergedStatus = 'cooking';
    }

    primaryOrder.items = mergedItems as any;
    primaryOrder.totalAmount = totalAmountCombined;
    primaryOrder.discountAmount = discountAmountCombined;
    primaryOrder.status = mergedStatus;
    await primaryOrder.save();

    const secondaryIds = secondaryOrders.map((o) => o._id);
    await this.orderModel.deleteMany({ _id: { $in: secondaryIds } }).exec();

    const populatedPrimaryOrder = await this.orderModel
      .findById(primaryOrder._id)
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    for (const secId of secondaryIds) {
      this.ordersGateway.emitOrderDeleted(secId.toString());
    }

    if (populatedPrimaryOrder) {
      this.ordersGateway.emitOrdersMerged(tableId, populatedPrimaryOrder);
    }

    return populatedPrimaryOrder || primaryOrder;
  }
}
