import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';

@Injectable()
export class PaymentsService implements OnModuleInit {
  constructor(
    @InjectModel(Payment.name) private readonly paymentModel: Model<PaymentDocument>,
    @Optional() @InjectModel(Order.name) private readonly orderModel?: Model<OrderDocument>,
  ) {}

  async onModuleInit() {
    // Không tự động tạo hoá đơn mẫu để số liệu kế toán phản ánh đúng thực tế
  }

  async generateInvoiceCode(): Promise<string> {
    let attempts = 0;
    while (attempts < 10) {
      const code = `HD-${Math.floor(100000 + Math.random() * 900000)}`;
      const existing = await this.paymentModel.findOne({ invoiceCode: code }).exec();
      if (!existing) return code;
      attempts++;
    }
    return `HD-${Date.now().toString().slice(-6)}`;
  }

  async createFromOrder(order: any, staffName = 'Nhân viên thu ngân'): Promise<PaymentDocument> {
    const existing = await this.paymentModel.findOne({ orderId: order._id }).exec();
    if (existing) {
      return existing;
    }

    const invoiceCode = await this.generateInvoiceCode();
    const tableName = (order.tableId as any)?.tableName || 'Mang về';
    const items = (order.items || []).map((item: any) => {
      const price = (item.foodId as any)?.price || item.price || 0;
      const foodName = (item.foodId as any)?.name || item.foodName || 'Món ăn';
      const quantity = item.quantity || 1;
      return {
        foodId: (item.foodId as any)?._id || item.foodId,
        foodName,
        price,
        quantity,
        total: price * quantity,
        note: item.note || '',
      };
    });

    const subtotal = items.reduce((sum, i) => sum + i.total, 0);

    const payment = new this.paymentModel({
      invoiceCode,
      orderId: order._id,
      tableId: (order.tableId as any)?._id || order.tableId,
      tableName,
      customerName: order.customerName || 'Khách vãng lai',
      items,
      subtotal,
      discountAmount: order.discountAmount || 0,
      couponCode: order.couponCode || null,
      totalAmount: order.totalAmount ?? subtotal,
      paymentMethod: order.paymentMethod || 'cash',
      transactionCode: order.paymentMethod === 'momo' ? `MM-${Math.floor(10000000 + Math.random() * 90000000)}` : null,
      staffName,
      paidAt: new Date(),
    });

    return payment.save();
  }

  async findAll(query?: string, paymentMethod?: string): Promise<PaymentDocument[]> {
    const filter: any = { isDeleted: { $ne: true } };

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    if (query && query.trim()) {
      const cleanQuery = query.trim();
      filter.$or = [
        { invoiceCode: new RegExp(cleanQuery, 'i') },
        { tableName: new RegExp(cleanQuery, 'i') },
        { customerName: new RegExp(cleanQuery, 'i') },
        { couponCode: new RegExp(cleanQuery, 'i') },
        { transactionCode: new RegExp(cleanQuery, 'i') },
      ];
    }

    return this.paymentModel.find(filter).sort({ paidAt: -1 }).exec();
  }

  async findByCode(invoiceCode: string): Promise<PaymentDocument> {
    const cleanCode = invoiceCode.trim().toUpperCase();
    const payment = await this.paymentModel.findOne({
      invoiceCode: new RegExp(`^${cleanCode}$`, 'i'),
      isDeleted: { $ne: true },
    }).exec();

    if (!payment) {
      throw new NotFoundException(`Không tìm thấy hóa đơn với mã: ${invoiceCode}`);
    }

    return payment;
  }

  async findOne(id: string): Promise<PaymentDocument> {
    const payment = await this.paymentModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    if (!payment) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }
    return payment;
  }

  async remove(id: string): Promise<{ message: string }> {
    const payment = await this.paymentModel.findOne({ _id: id, isDeleted: { $ne: true } }).exec();
    if (!payment) {
      throw new NotFoundException(`Không tìm thấy hóa đơn ID: ${id}`);
    }

    await this.paymentModel.findByIdAndUpdate(id, { isDeleted: true }).exec();
    if (payment.orderId && this.orderModel) {
      await this.orderModel.findByIdAndUpdate(payment.orderId, { isDeleted: true }).exec().catch(() => {});
    }

    return { message: 'Đã xóa hóa đơn thành công.' };
  }

  async removeBulk(ids: string[]): Promise<{ message: string; deletedCount: number }> {
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      throw new BadRequestException('Danh sách ID hóa đơn cần xóa không hợp lệ.');
    }

    const payments = await this.paymentModel.find({ _id: { $in: ids }, isDeleted: { $ne: true } }).exec();
    const orderIds = payments.map((p) => p.orderId).filter(Boolean);

    const result = await this.paymentModel.updateMany({ _id: { $in: ids } }, { isDeleted: true }).exec();

    if (orderIds.length > 0 && this.orderModel) {
      await this.orderModel.updateMany({ _id: { $in: orderIds } }, { isDeleted: true }).exec().catch(() => {});
    }

    return {
      message: `Đã xóa thành công ${result.modifiedCount} hóa đơn.`,
      deletedCount: result.modifiedCount,
    };
  }

  async updateTableForOrders(orderIds: string[], toTableId: string, toTableName: string): Promise<void> {
    if (!orderIds || orderIds.length === 0) return;
    await this.paymentModel.updateMany(
      { orderId: { $in: orderIds } },
      { $set: { tableId: toTableId, tableName: toTableName } },
    ).exec();
  }
}
