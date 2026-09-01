import { Injectable, NotFoundException, ConflictException, Optional, Inject, forwardRef } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './schemas/table.schema.js';
import { Reservation, ReservationDocument } from '../reservations/schemas/reservation.schema.js';
import { Order, OrderDocument } from '../orders/schemas/order.schema.js';
import { OrdersGateway } from '../orders/orders.gateway.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private readonly tableModel: Model<TableDocument>,
    @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
    @Optional() @InjectModel(Order.name) private readonly orderModel?: Model<OrderDocument>,
    @Optional() @Inject(forwardRef(() => OrdersGateway)) private readonly ordersGateway?: OrdersGateway,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<TableDocument> {
    const numberOnly = createTableDto.tableName.replace(/\D/g, '');
    const normalizedName = numberOnly ? `Bàn số ${numberOnly}` : createTableDto.tableName.trim();

    const existingTable = await this.tableModel.findOne({
      $or: [
        { tableName: normalizedName },
        { tableName: numberOnly },
        { tableName: new RegExp(`^Bàn số ${numberOnly}$`, 'i') },
      ],
    });
    if (existingTable) {
      throw new ConflictException(
        `Bàn số ${numberOnly || createTableDto.tableName} đã tồn tại trong hệ thống.`,
      );
    }

    const newTable = new this.tableModel({
      ...createTableDto,
      tableName: normalizedName,
    });
    return newTable.save();
  }

  async findAll(): Promise<any[]> {
    const tables = await this.tableModel.find().sort({ tableName: 1 }).lean().exec();
    return tables;
  }

  async findOne(id: string): Promise<any> {
    let table: any = null;

    if (id && id.match(/^[0-9a-fA-F]{24}$/)) {
      table = await this.tableModel.findById(id).lean().exec();
    }

    if (!table) {
      const numberOnly = id.replace(/\D/g, '');
      const searchConditions: any[] = [{ tableName: id.trim() }];
      if (numberOnly) {
        searchConditions.push({ tableName: `Bàn số ${numberOnly}` });
        searchConditions.push({ tableName: numberOnly });
      }
      table = await this.tableModel.findOne({ $or: searchConditions }).lean().exec();
    }

    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID hoặc Tên: ${id}`);
    }

    if (!table.qrToken) {
      const newToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      await this.tableModel.findByIdAndUpdate(table._id, { qrToken: newToken }).exec();
      table.qrToken = newToken;
    }
    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<TableDocument> {
    let normalizedPayload: any = { ...updateTableDto };
    if (updateTableDto.status === 'empty') {
      normalizedPayload.qrToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
      normalizedPayload.currentSessionStartedAt = new Date();
      this.activeOccupantsMap.delete(id);
    }

    if (updateTableDto.tableName) {
      const numberOnly = updateTableDto.tableName.replace(/\D/g, '');
      const normalizedName = numberOnly ? `Bàn số ${numberOnly}` : updateTableDto.tableName.trim();

      const existingTable = await this.tableModel.findOne({
        _id: { $ne: id },
        $or: [
          { tableName: normalizedName },
          { tableName: numberOnly },
          { tableName: new RegExp(`^Bàn số ${numberOnly}$`, 'i') },
        ],
      });
      if (existingTable) {
        throw new ConflictException(
          `Bàn số ${numberOnly || updateTableDto.tableName} đã tồn tại trong hệ thống.`,
        );
      }
      normalizedPayload.tableName = normalizedName;
    }

    const updatedTable = await this.tableModel
      .findByIdAndUpdate(id, normalizedPayload, { new: true })
      .exec();

    if (!updatedTable) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }

    if (this.ordersGateway && updatedTable) {
      this.ordersGateway.emitTableUpdate(id, updatedTable.status);
    }

    return updatedTable;
  }

  async regenerateQrToken(id: string): Promise<TableDocument> {
    const newToken = Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
    const updatedTable = await this.tableModel
      .findByIdAndUpdate(id, { qrToken: newToken }, { new: true })
      .exec();

    if (!updatedTable) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }
    return updatedTable;
  }

  private activeOccupantsMap = new Map<string, Set<string>>();

  async joinSession(tableId: string, deviceId?: string): Promise<{ occupantCount: number }> {
    if (!this.activeOccupantsMap.has(tableId)) {
      this.activeOccupantsMap.set(tableId, new Set());
    }
    const currentCount = this.activeOccupantsMap.get(tableId)!.size;
    const table = await this.findOne(tableId).catch(() => null);
    const tableName = table?.tableName || `Bàn số ${tableId.slice(-4)}`;

    if (currentCount === 0) {
      if (table && table.status === 'empty') {
        await this.update(tableId, { status: 'serving', currentSessionStartedAt: new Date() } as any);
      }
      if (this.ordersGateway) {
        this.ordersGateway.emitGuestJoined({ tableId, tableName });
      }
    }
    if (deviceId) {
      this.activeOccupantsMap.get(tableId)!.add(deviceId);
    }
    return { occupantCount: this.activeOccupantsMap.get(tableId)!.size };
  }

  async leaveSession(tableId: string, deviceId?: string): Promise<{ isTableCleared: boolean; remainingCount: number }> {
    const table = await this.findOne(tableId).catch(() => null);
    const tableName = table?.tableName || `Bàn số ${tableId.slice(-4)}`;

    if (deviceId && this.activeOccupantsMap.has(tableId)) {
      this.activeOccupantsMap.get(tableId)!.delete(deviceId);
    }

    // Kiểm tra số lượng đơn hàng chưa thanh toán còn lại của bàn
    const activeOrdersCount = this.orderModel
      ? await this.orderModel.countDocuments({
          tableId,
          status: { $nin: ['paid', 'cancelled'] },
          isDeleted: { $ne: true },
        }).exec().catch(() => 0)
      : 0;

    // Nếu không còn đơn hàng nào chưa thanh toán, tự động dọn dẹp bàn về trạng thái 'empty'
    if (activeOrdersCount === 0) {
      this.activeOccupantsMap.delete(tableId);
      await this.update(tableId, { status: 'empty' });
      if (this.ordersGateway) {
        this.ordersGateway.emitGuestLeft({ tableId, tableName });
      }
      return { isTableCleared: true, remainingCount: 0 };
    }

    const remainingCount = this.activeOccupantsMap.get(tableId)?.size || 0;
    if (remainingCount === 0) {
      await this.update(tableId, { status: 'empty' });
      if (this.ordersGateway) {
        this.ordersGateway.emitGuestLeft({ tableId, tableName });
      }
      return { isTableCleared: true, remainingCount: 0 };
    }
    return { isTableCleared: false, remainingCount };
  }

  getOccupantCount(tableId: string): number {
    return this.activeOccupantsMap.get(tableId)?.size || 0;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedTable = await this.tableModel.findByIdAndDelete(id).exec();
    if (!deletedTable) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }
    return { message: `Đã xóa bàn "${deletedTable.tableName}" thành công.` };
  }
}
