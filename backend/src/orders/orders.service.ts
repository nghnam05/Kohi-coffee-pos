import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { OrdersGateway } from './orders.gateway.js';
import { FoodsService } from '../foods/foods.service.js';
import { TablesService } from '../tables/tables.service.js';
import { CouponsService } from '../coupons/coupons.service.js';
import { PaymentsService } from '../payments/payments.service.js';

@Injectable()
export class OrdersService implements OnModuleInit {
  constructor(
    @InjectModel(Order.name) private readonly orderModel: Model<OrderDocument>,
    private readonly ordersGateway: OrdersGateway,
    private readonly foodsService: FoodsService,
    private readonly tablesService: TablesService,
    private readonly couponsService: CouponsService,
    @Optional() @Inject(PaymentsService) private readonly paymentsService?: PaymentsService,
  ) {}

  async onModuleInit() {
    const count = await this.orderModel.countDocuments();
    if (count === 0) {
      try {
        const foods = await this.foodsService.findAll();
        const tables = await this.tablesService.findAll();
        if (foods.length > 0) {
          const sampleOrders: any[] = [];
          const now = new Date();
          const food1 = foods[0]._id;
          const food2 = foods[1] ? foods[1]._id : food1;
          const food3 = foods[2] ? foods[2]._id : food1;
          const table1 = tables[0] ? tables[0]._id : null;

          for (let i = 0; i < 15; i++) {
            const dateOffset = Math.floor(i / 3);
            const orderDate = new Date(now);
            orderDate.setDate(now.getDate() - dateOffset);
            orderDate.setHours(9 + (i % 8), (i * 17) % 60);

            sampleOrders.push({
              tableId: table1,
              customerName: `Khách hàng #${101 + i}`,
              items: [
                { foodId: food1, quantity: (i % 3) + 1 },
                { foodId: food2, quantity: (i % 2) + 1 },
                { foodId: food3, quantity: 1 },
              ],
              totalAmount: 120000 + i * 15000,
              status: 'paid',
              paymentStatus: 'paid',
              paymentMethod: i % 2 === 0 ? 'momo' : 'cash',
              paidAt: orderDate,
              createdAt: orderDate,
            });
          }
          const insertedOrders = await this.orderModel.insertMany(sampleOrders);
          console.log('[Seed] Sample Paid Orders initialized in Database for Revenue & Top Selling statistics.');

          if (this.paymentsService) {
            for (const ord of insertedOrders) {
              await this.paymentsService.createFromOrder(ord).catch(() => {});
            }
          }
        }
      } catch (err) {
        console.error('[Seed Error] Failed to seed sample orders:', err);
      }
    }
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

    // Cập nhật trạng thái bàn ăn sang 'serving' (có khách) nếu đang empty
    if (createOrderDto.tableId) {
      const table = await this.tablesService.findOne(createOrderDto.tableId).catch(() => null);
      if (!table || table.status === 'empty') {
        await this.tablesService.update(createOrderDto.tableId, {
          status: 'serving',
          currentSessionStartedAt: new Date(),
        } as any).catch(() => {});
      }
    }

    // Populate dữ liệu liên quan để trả về client và phát tín hiệu qua Socket
    const populatedOrder = await this.orderModel
      .findById(savedOrder._id)
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (populatedOrder) {
      this.ordersGateway.emitNewOrder(populatedOrder);
      if (createOrderDto.tableId) {
        this.ordersGateway.emitClearGroupCart(createOrderDto.tableId.toString());
      }
      return populatedOrder;
    }

    return savedOrder;
  }

  async findAll(status?: string): Promise<any[]> {
    const filter = status ? { status, isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
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

    if (!order || (order as any).isDeleted) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }
    return order;
  }

  async findByTable(tableId: string, activeOnly = false): Promise<any[]> {
    const table = await this.tablesService.findOne(tableId).catch(() => null);
    if (!table) {
      return [];
    }

    const twelveHoursAgo = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const sessionTime = table.currentSessionStartedAt
      ? new Date(table.currentSessionStartedAt)
      : twelveHoursAgo;

    const query: any = {
      tableId,
      status: { $ne: 'cancelled' },
      isDeleted: { $ne: true },
      createdAt: { $gte: sessionTime },
    };

    if (activeOnly) {
      query.status = { $nin: ['paid', 'cancelled'] };
    }

    return this.orderModel
      .find(query)
      .populate('tableId')
      .populate('items.foodId')
      .sort({ createdAt: 1 })
      .lean()
      .exec() as any;
  }

  async updateStatus(id: string, updateOrderStatusDto: UpdateOrderStatusDto, userRole?: string): Promise<OrderDocument> {
    if (userRole === 'barista' && updateOrderStatusDto.status === 'paid') {
      throw new ForbiddenException('Nhân viên pha chế không có quyền xác nhận thanh toán đơn hàng.');
    }

    const updatePayload: any = { status: updateOrderStatusDto.status };
    if (updateOrderStatusDto.status === 'paid') {
      updatePayload.paymentStatus = 'paid';
      updatePayload.paymentNotified = false;
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

    if (updateOrderStatusDto.status === 'ready' || updateOrderStatusDto.status === 'completed') {
      const tableName = (updatedOrder.tableId as any)?.tableName || 'Bàn';
      this.ordersGateway.emitDrinkReadyNotification({
        orderId: updatedOrder._id.toString(),
        tableName,
        items: updatedOrder.items,
      });
    }

    if (updateOrderStatusDto.status === 'paid') {
      console.log(`[Payment Completed] Đơn hàng ${id} đã thanh toán thành công và lưu vết vào DB.`);
      
      // Tự động tặng Voucher 10% nếu tổng hóa đơn > 300k
      if (this.couponsService) {
        await this.checkAndIssueRewardVoucher(updatedOrder);
      }

      if (this.paymentsService && updatedOrder) {
        await this.paymentsService.createFromOrder(updatedOrder).catch((err) => {
          console.error('[Payment Record Error]:', err);
        });
      }
      if (updatedOrder.tableId) {
        const tableIdStr = (updatedOrder.tableId as any)?._id
          ? (updatedOrder.tableId as any)._id.toString()
          : updatedOrder.tableId.toString();
        if (tableIdStr) {
          const occupantCount = this.tablesService.getOccupantCount(tableIdStr);
          if (occupantCount === 0) {
            await this.tablesService.update(tableIdStr, { status: 'empty' }).catch(() => {});
            this.ordersGateway.emitTableUpdate(tableIdStr, 'empty');
          }
        }
      }
    }

    return updatedOrder;
  }

  private async checkAndIssueRewardVoucher(order: OrderDocument): Promise<string | null> {
    if (order.totalAmount >= 300000 && !order.rewardedVoucherCode) {
      try {
        const rewardCoupon = await this.couponsService.generateRewardCouponForOrder(
          order._id.toString(),
          order.totalAmount,
        );
        order.rewardedVoucherCode = rewardCoupon.code;
        await order.save();
        console.log(`[Reward Voucher] Đã tặng voucher ${rewardCoupon.code} cho đơn hàng >300k (${order._id})`);
        
        const tableIdStr = (order.tableId as any)?._id
          ? (order.tableId as any)._id.toString()
          : order.tableId?.toString();

        if (this.ordersGateway) {
          this.ordersGateway.emitRewardVoucherIssued({
            orderId: order._id.toString(),
            voucherCode: rewardCoupon.code,
            totalAmount: order.totalAmount,
            tableId: tableIdStr,
          });
        }
        return rewardCoupon.code;
      } catch (err) {
        console.error('[Reward Voucher Error]:', err);
      }
    }
    return null;
  }

  async notifyPayment(id: string): Promise<OrderDocument> {
    const updatedOrder = await this.orderModel
      .findByIdAndUpdate(
        id,
        { paymentNotified: true, paymentMethod: 'bank_transfer' },
        { new: true }
      )
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (!updatedOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    if (this.ordersGateway) {
      this.ordersGateway.emitPaymentNotified(updatedOrder);
    }

    return updatedOrder;
  }

  async transferTable(fromTableId: string, toTableId: string): Promise<any> {
    // 1. Tìm các đơn hàng chưa hoàn tất hoặc đã xong món nhưng chưa thanh toán
    const activeOrders = await this.orderModel.find({
      tableId: fromTableId,
      status: { $nin: ['paid', 'cancelled'] },
    });

    // 2. Cập nhật ID bàn mới cho tất cả các đơn hàng hoạt động đó (nếu có)
    if (activeOrders.length > 0) {
      await this.orderModel.updateMany(
        { tableId: fromTableId, status: { $nin: ['paid', 'cancelled'] } },
        { tableId: toTableId },
      );
    }

    // 3. Chuyển giỏ hàng món ăn đang chọn (Unsubmitted Group Cart) ở bộ nhớ Socket sang bàn mới
    if (this.ordersGateway) {
      this.ordersGateway.transferGroupCart(fromTableId, toTableId);
    }

    // 4. Cập nhật trạng thái hoạt động của 2 bàn thông qua TablesService
    await this.tablesService.update(fromTableId, { status: 'empty' });
    await this.tablesService.update(toTableId, { status: 'serving' });

    // 5. Phát tín hiệu qua Socket để các màn hình Dashboard của admin/nhân viên và khách cập nhật lại real-time
    if (this.ordersGateway && this.ordersGateway.server) {
      this.ordersGateway.server.emit('tableTransferred', { fromTableId, toTableId });
    }

    return { message: 'Chuyển bàn thành công', fromTableId, toTableId };
  }

  async remove(id: string, userRole?: string): Promise<{ message: string }> {
    const order = await this.orderModel.findById(id).exec();
    if (!order || (order as any).isDeleted) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    if (userRole === 'barista' && ['ready', 'served', 'completed', 'paid'].includes(order.status)) {
      throw new ForbiddenException('Nhân viên pha chế không có quyền xóa đơn hàng đã hoàn tất ra món.');
    }

    await this.orderModel.findByIdAndUpdate(id, { isDeleted: true }).exec();
    this.ordersGateway.emitOrderDeleted(id);

    // Tự động giải phóng bàn nếu không còn đơn hàng active nào khác
    if (order.tableId) {
      const tableId = (order.tableId as any)?._id || order.tableId;
      const remainingActiveOrders = await this.orderModel.countDocuments({
        tableId,
        status: { $nin: ['paid', 'cancelled'] },
        isDeleted: { $ne: true },
      });
      if (remainingActiveOrders === 0) {
        await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
      }
    }

    return { message: `Đã xóa đơn hàng ${id} thành công.` };
  }

  async removeBulk(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID đơn hàng cần xóa không hợp lệ.');
    }

    const ordersToDelete = await this.orderModel.find({ _id: { $in: ids }, isDeleted: { $ne: true } }).exec();
    const result = await this.orderModel.updateMany({ _id: { $in: ids } }, { isDeleted: true }).exec();

    const affectedTableIds = new Set<string>();
    for (const ord of ordersToDelete) {
      this.ordersGateway.emitOrderDeleted(ord._id.toString());
      if (ord.tableId) {
        const tid = (ord.tableId as any)?._id || ord.tableId;
        affectedTableIds.add(tid.toString());
      }
    }

    for (const tid of affectedTableIds) {
      const remaining = await this.orderModel.countDocuments({
        tableId: tid,
        status: { $nin: ['paid', 'cancelled'] },
        isDeleted: { $ne: true },
      });
      if (remaining === 0) {
        await this.tablesService.update(tid, { status: 'empty' }).catch(() => {});
      }
    }

    const deletedCount = (result as any)?.deletedCount ?? (result as any)?.modifiedCount ?? ids.length;

    return { message: `Đã xóa ${deletedCount} đơn hàng thành công.`, deletedCount };
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

    let grossTotal = 0;
    for (const item of mergedItems) {
      const food = await this.foodsService.findOne(item.foodId.toString());
      grossTotal += (food.price || 0) * item.quantity;
    }

    let combinedDiscount = primaryOrder.discountAmount || 0;
    for (const secOrder of secondaryOrders) {
      combinedDiscount += secOrder.discountAmount || 0;
    }

    primaryOrder.items = mergedItems;
    primaryOrder.discountAmount = combinedDiscount;
    primaryOrder.totalAmount = Math.max(0, grossTotal - combinedDiscount);
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
