import { Injectable, NotFoundException, BadRequestException, ForbiddenException, OnModuleInit, Optional, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema.js';
import { CreateOrderDto } from './dto/create-order.dto.js';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto.js';
import { NotifySplitPaymentDto, ConfirmSplitPaymentDto } from './dto/split-payment.dto.js';
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
    // Không tự động tạo đơn ảo để số liệu doanh thu luôn phản ánh đúng dữ liệu bán hàng thực tế
  }

  async cleanupExpiredPaidOrders() {
    // Lưu lịch sử vào DB để phục vụ thống kê doanh thu cho admin
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderDocument> {
    // 🛡️ Chống spam đơn ảo qua mã QR: Mỗi bàn chỉ được có tối đa 1 đơn chờ duyệt (pending)
    if (createOrderDto.tableId) {
      const existingPending = await this.orderModel.findOne({
        tableId: createOrderDto.tableId,
        status: 'pending',
      }).exec();
      if (existingPending) {
        throw new BadRequestException(
          'Bàn hiện đang có 1 đơn hàng chờ nhân viên xác nhận. Vui lòng chờ nhân viên tiếp nhận đơn trước khi đặt thêm món!',
        );
      }
    }

    let totalAmount = 0;

    // 🚀 Tối ưu hóa truy vấn DB: Gom nhóm kiểm tra món ăn thành 1 truy vấn duy nhất (Eliminate N+1)
    const foodIds = [...new Set(createOrderDto.items.map((item) => item.foodId))];
    const foods = await this.foodsService.findManyByIds(foodIds);
    const foodMap = new Map(foods.map((f: any) => [f._id.toString(), f]));

    for (const item of createOrderDto.items) {
      const food = foodMap.get(item.foodId.toString());
      if (!food) {
        throw new NotFoundException(`Không tìm thấy món ăn với ID: ${item.foodId}`);
      }
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
        this.ordersGateway.emitGroupOrderSubmitted({
          tableId: createOrderDto.tableId.toString(),
          orderId: populatedOrder._id.toString(),
          customerName: populatedOrder.customerName || 'Bàn',
          submittedBy: createOrderDto.customerName || 'Khách',
        });
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

      // Tự động cộng dồn số lượng đã bán (soldCount) cho từng món trong đơn
      if (this.foodsService && updatedOrder.items) {
        for (const item of updatedOrder.items) {
          const fId = (item.foodId as any)?._id || item.foodId;
          if (fId) {
            await this.foodsService.incrementSoldCount(fId.toString(), item.quantity || 1).catch(() => {});
          }
        }
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

    if (updateOrderStatusDto.status === 'cancelled' && updatedOrder.tableId) {
      const tableIdStr = (updatedOrder.tableId as any)?._id
        ? (updatedOrder.tableId as any)._id.toString()
        : updatedOrder.tableId.toString();
      if (tableIdStr) {
        const remainingActive = await this.orderModel.countDocuments({
          tableId: (updatedOrder.tableId as any)?._id || updatedOrder.tableId,
          _id: { $ne: updatedOrder._id },
          status: { $in: ['pending', 'confirmed', 'cooking', 'ready', 'completed'] },
        });
        if (remainingActive === 0) {
          await this.tablesService.update(tableIdStr, { status: 'empty' }).catch(() => {});
          this.ordersGateway.emitTableUpdate(tableIdStr, 'empty');
        }
      }
    }

    return updatedOrder;
  }

  private pendingTransferRequests = new Map<string, {
    id: string;
    fromTableId: string;
    fromTableName: string;
    toTableId: string;
    toTableName: string;
    customerName?: string;
    createdAt: Date;
  }>();

  async requestTableTransfer(fromTableId: string, toTableId: string, customerName?: string): Promise<any> {
    const fromTable = await this.tablesService.findOne(fromTableId);
    if (!fromTable) throw new NotFoundException('Không tìm thấy bàn xuất phát.');

    const toTable = await this.tablesService.findOne(toTableId);
    if (!toTable) throw new NotFoundException('Không tìm thấy bàn đích.');

    if (toTable.status === 'serving') {
      throw new BadRequestException(`${toTable.tableName} hiện đang có khách ngồi. Vui lòng chọn bàn trống khác.`);
    }

    const activeOrders = await this.orderModel.find({
      tableId: fromTableId,
      status: { $nin: ['paid', 'cancelled'] },
      isDeleted: { $ne: true },
    });

    // Kiểm tra xem đã có yêu cầu chuyển bàn trùng với yêu cầu cũ chưa duyệt hay không
    const existingEntry = Array.from(this.pendingTransferRequests.values()).find(
      (r) => r.fromTableId === fromTableId && r.toTableId === toTableId,
    );

    if (existingEntry) {
      existingEntry.createdAt = new Date();
      if (customerName) existingEntry.customerName = customerName;
      return {
        message: 'Yêu cầu chuyển bàn đã được ghi nhận trước đó. Vui lòng chờ nhân viên duyệt.',
        requestId: existingEntry.id,
        fromTableName: fromTable.tableName,
        toTableName: toTable.tableName,
      };
    }

    const requestId = `tr-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const requestData = {
      id: requestId,
      fromTableId,
      fromTableName: fromTable.tableName,
      toTableId,
      toTableName: toTable.tableName,
      customerName: customerName || activeOrders[0]?.customerName || 'Khách hàng',
      createdAt: new Date(),
    };

    this.pendingTransferRequests.set(requestId, requestData);

    if (this.ordersGateway) {
      this.ordersGateway.emitTableTransferRequested(requestData);
    }

    return {
      message: 'Yêu cầu chuyển bàn đã được gửi đến nhân viên. Vui lòng chờ xác nhận.',
      requestId,
      fromTableName: fromTable.tableName,
      toTableName: toTable.tableName,
    };
  }

  getPendingTransferRequests(): any[] {
    return Array.from(this.pendingTransferRequests.values());
  }

  async approveTableTransfer(requestId: string): Promise<any> {
    const req = this.pendingTransferRequests.get(requestId);
    if (!req) {
      throw new NotFoundException('Yêu cầu chuyển bàn không tồn tại hoặc đã được xử lý.');
    }

    const result = await this.transferTable(req.fromTableId, req.toTableId);
    this.pendingTransferRequests.delete(requestId);

    if (this.ordersGateway) {
      this.ordersGateway.emitTableTransferApproved({
        id: requestId,
        fromTableId: req.fromTableId,
        toTableId: req.toTableId,
        fromTableName: req.fromTableName,
        toTableName: req.toTableName,
      });
    }

    return {
      message: 'Đã chấp nhận chuyển bàn thành công.',
      ...result,
    };
  }

  async rejectTableTransfer(requestId: string, reason?: string): Promise<any> {
    const req = this.pendingTransferRequests.get(requestId);
    if (!req) {
      throw new NotFoundException('Yêu cầu chuyển bàn không tồn tại hoặc đã được xử lý.');
    }

    this.pendingTransferRequests.delete(requestId);

    if (this.ordersGateway) {
      this.ordersGateway.emitTableTransferRejected({
        id: requestId,
        fromTableId: req.fromTableId,
        toTableId: req.toTableId,
        reason: reason || 'Nhân viên không thể đáp ứng yêu cầu chuyển bàn lúc này.',
      });
    }

    return { message: 'Đã từ chối yêu cầu chuyển bàn.', requestId };
  }

  private async checkAndIssueRewardVoucher(order: OrderDocument): Promise<string | null> {
    const tableIdStr = (order.tableId as any)?._id
      ? (order.tableId as any)._id.toString()
      : order.tableId?.toString();

    let totalSessionAmount = order.totalAmount || 0;
    if (tableIdStr) {
      const tableOrders = await this.orderModel.find({
        tableId: tableIdStr,
        status: { $ne: 'cancelled' },
        isDeleted: { $ne: true },
      }).exec();
      totalSessionAmount = tableOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
    }

    if (totalSessionAmount >= 300000 && !order.rewardedVoucherCode) {
      try {
        const rewardCoupon = await this.couponsService.generateRewardCouponForOrder(
          order._id.toString(),
          totalSessionAmount,
        );
        order.rewardedVoucherCode = rewardCoupon.code;
        await order.save();
        console.log(`[Reward Voucher] Đã tặng voucher ${rewardCoupon.code} cho đơn/bàn >300k (${order._id})`);

        if (this.ordersGateway) {
          this.ordersGateway.emitRewardVoucherIssued({
            orderId: order._id.toString(),
            voucherCode: rewardCoupon.code,
            totalAmount: totalSessionAmount,
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
    const existingOrder = await this.orderModel.findById(id).exec();
    if (!existingOrder) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }
    if (existingOrder.status === 'pending') {
      throw new BadRequestException('Đơn hàng đang chờ phục vụ duyệt. Vui lòng đợi nhân viên xác nhận trước khi thanh toán.');
    }

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

  async notifySplitPayment(id: string, dto: NotifySplitPaymentDto): Promise<OrderDocument> {
    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    if (order.status === 'pending') {
      throw new BadRequestException('Đơn hàng đang chờ phục vụ duyệt. Vui lòng đợi nhân viên xác nhận trước khi thanh toán.');
    }

    const transactionId = 'SPLIT-' + Math.random().toString(36).substring(2, 9).toUpperCase();
    const newPartial = {
      transactionId,
      payerName: dto.payerName || 'Khách',
      deviceId: dto.deviceId || null,
      amount: dto.amount,
      paymentMethod: dto.paymentMethod || 'bank_transfer',
      itemIndexes: dto.itemIndexes || [],
      paidAt: new Date(),
      status: 'pending' as const,
    };

    order.partialPayments = order.partialPayments || [];
    order.partialPayments.push(newPartial as any);
    order.paymentNotified = true;
    await order.save();

    const populated = await this.orderModel
      .findById(id)
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (!populated) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    const tableIdStr = (populated.tableId as any)?._id?.toString() || populated.tableId?.toString();

    if (this.ordersGateway) {
      this.ordersGateway.emitSplitPaymentNotified({
        orderId: id,
        tableId: tableIdStr,
        tableName: (populated.tableId as any)?.tableName || 'Bàn',
        splitPayment: newPartial,
        order: populated,
      });
    }

    return populated;
  }

  async confirmSplitPayment(id: string, dto: ConfirmSplitPaymentDto, userRole?: string): Promise<OrderDocument> {
    if (userRole === 'barista') {
      throw new ForbiddenException('Nhân viên pha chế không có quyền xác nhận thanh toán.');
    }

    const order = await this.orderModel.findById(id).exec();
    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    const payer = dto.payerName || 'Khách';
    const amount = Number(dto.amount) || 0;
    const now = new Date();

    // Mark selected items as paid
    if (Array.isArray(dto.itemIndexes) && dto.itemIndexes.length > 0) {
      dto.itemIndexes.forEach((idx) => {
        if (order.items && order.items[idx]) {
          order.items[idx].isPaid = true;
          order.items[idx].paidBy = payer;
          order.items[idx].paidAt = now;
        }
      });
    }

    // Update paidAmount
    order.paidAmount = (order.paidAmount || 0) + amount;

    // Update or append partial payment record
    order.partialPayments = order.partialPayments || [];
    let recordFound = false;
    if (dto.transactionId) {
      const match = order.partialPayments.find((p) => p.transactionId === dto.transactionId);
      if (match) {
        match.status = 'confirmed';
        recordFound = true;
      }
    }
    if (!recordFound) {
      order.partialPayments.push({
        transactionId: dto.transactionId || 'SPLIT-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
        payerName: payer,
        amount,
        paymentMethod: dto.paymentMethod || 'bank_transfer',
        itemIndexes: dto.itemIndexes || [],
        paidAt: now,
        status: 'confirmed',
      });
    }

    // Check if all items paid or total amount reached
    const allItemsPaid = order.items.length > 0 && order.items.every((item) => item.isPaid === true);
    const fullAmountReached = order.paidAmount >= order.totalAmount;

    const isFullyPaid = allItemsPaid || fullAmountReached;

    if (isFullyPaid) {
      order.status = 'paid';
      order.paymentStatus = 'paid';
      order.paidAt = now;
      order.paymentNotified = false;
    }

    await order.save();

    const populated = await this.orderModel
      .findById(id)
      .populate('tableId')
      .populate('items.foodId')
      .exec();

    if (!populated) {
      throw new NotFoundException(`Không tìm thấy đơn hàng với ID: ${id}`);
    }

    const tableIdStr = (populated.tableId as any)?._id?.toString() || populated.tableId?.toString();

    if (this.ordersGateway) {
      this.ordersGateway.emitSplitPaymentUpdated({
        orderId: id,
        tableId: tableIdStr,
        order: populated,
      });

      if (isFullyPaid) {
        this.ordersGateway.emitStatusUpdate(id, 'paid');
      }
    }

    if (isFullyPaid) {
      console.log(`[Split Payment Complete] Đơn hàng ${id} đã thanh toán đủ 100%.`);
      if (this.couponsService) {
        await this.checkAndIssueRewardVoucher(populated);
      }
      if (this.paymentsService) {
        await this.paymentsService.createFromOrder(populated).catch((err) => {
          console.error('[Payment Record Error]:', err);
        });
      }
      if (tableIdStr) {
        const occupantCount = this.tablesService.getOccupantCount(tableIdStr);
        if (occupantCount === 0) {
          await this.tablesService.update(tableIdStr, { status: 'empty' }).catch(() => {});
          this.ordersGateway.emitTableUpdate(tableIdStr, 'empty');
        }
      }
    }

    return populated;
  }

  async transferTable(fromTableId: string, toTableId: string): Promise<any> {
    const toTable = await this.tablesService.findOne(toTableId).catch(() => null);
    const toTableName = toTable?.tableName || 'Bàn mới';

    // 1. Tìm các đơn hàng chưa hoàn tất hoặc đã xong món nhưng chưa thanh toán
    const activeOrders = await this.orderModel.find({
      tableId: fromTableId,
      status: { $nin: ['paid', 'cancelled'] },
      isDeleted: { $ne: true },
    });

    const activeOrderIds = activeOrders.map((o) => o._id.toString());

    // 2. Cập nhật ID bàn mới cho tất cả các đơn hàng hoạt động đó
    if (activeOrders.length > 0) {
      await this.orderModel.updateMany(
        { tableId: fromTableId, status: { $nin: ['paid', 'cancelled'] } },
        { tableId: toTableId },
      );
    }

    // 3. Cập nhật Payment records liên quan để chi tiết hóa đơn hiển thị đúng tên bàn mới
    if (this.paymentsService && activeOrderIds.length > 0) {
      await this.paymentsService.updateTableForOrders(activeOrderIds, toTableId, toTableName).catch(() => {});
    }

    // 4. Chuyển giỏ hàng món ăn chưa chốt (Unsubmitted Group Cart) sang bàn mới
    if (this.ordersGateway) {
      this.ordersGateway.transferGroupCart(fromTableId, toTableId);
    }

    // 5. Cập nhật triệt để trạng thái bàn cũ về empty (và dọn bộ nhớ activeOccupantsMap)
    this.tablesService.clearTableOccupants(fromTableId);
    await this.tablesService.update(fromTableId, { status: 'empty' });
    await this.tablesService.update(toTableId, { status: 'serving' });

    // 6. Phát tín hiệu Socket cho các màn hình khách & nhân viên
    if (this.ordersGateway && this.ordersGateway.server) {
      this.ordersGateway.server.emit('tableTransferred', { fromTableId, toTableId, toTableName });
      this.ordersGateway.emitTableUpdate(fromTableId, 'empty');
      this.ordersGateway.emitTableUpdate(toTableId, 'serving');
    }

    return { message: 'Chuyển bàn thành công', fromTableId, toTableId, toTableName };
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
