import {
  Injectable, NotFoundException, BadRequestException, OnModuleInit, Optional, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { TablesService } from '../tables/tables.service.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

@Injectable()
export class ReservationsService implements OnModuleInit {
  constructor(
    @InjectModel(Reservation.name) private readonly reservationModel: Model<ReservationDocument>,
    private readonly tablesService: TablesService,
    @Optional() @Inject(OrdersGateway) private readonly ordersGateway?: OrdersGateway,
  ) {}

  async syncTableStatusesWithReservations() {
    try {
      const activeReservations = await this.reservationModel
        .find({ status: { $in: ['pending', 'confirmed'] }, isDeleted: { $ne: true } })
        .exec();

      for (const res of activeReservations) {
        const tableId = (res.tableId as any)?._id || res.tableId;
        if (tableId) {
          const table = await this.tablesService.findOne(tableId.toString()).catch(() => null);
          if (table && table.status !== 'serving') {
            await this.tablesService.update(tableId.toString(), { status: 'reserved' }).catch(() => {});
          }
        }
      }
    } catch (err) {
      console.error('[Sync Error] Failed to sync table statuses with reservations:', err);
    }
  }

  async onModuleInit() {
    try {
      // Clear sample reservations from database
      const result = await this.reservationModel.deleteMany({
        $or: [
          { customerPhone: '0000000000_SEED_MARKER' },
          { customerName: { $in: ['Nguyễn Văn An', 'Trần Thị Mai'] } },
          { note: { $regex: /Đặt bàn họp nhóm|Bàn hẹn hò/i } },
        ]
      });
      if (result.deletedCount > 0) {
        console.log(`[Clean] Cleared ${result.deletedCount} seed reservations from database.`);
      }
    } catch (err) {
      console.error('[Clean Error] Failed to clear seed reservations:', err);
    }
    await this.syncTableStatusesWithReservations();
  }

  async create(dto: CreateReservationDto): Promise<ReservationDocument> {
    const table = await this.tablesService.findOne(dto.tableId);
    if (!table) throw new NotFoundException('Không tìm thấy bàn ăn được chọn.');

    // ⚡ BẢO VỆ CHỐNG ĐẶT TRÙNG BÀN: Bàn đang có khách hoặc đã giữ chỗ thì không cho đặt
    if (table.status === 'serving') {
      throw new BadRequestException(`${table.tableName} hiện đang có khách ngồi. Vui lòng chọn bàn khác.`);
    }

    const activeExistingRes = await this.reservationModel.findOne({
      tableId: dto.tableId,
      status: { $in: ['pending', 'confirmed'] },
      isDeleted: { $ne: true },
    });
    if (activeExistingRes || table.status === 'reserved') {
      throw new BadRequestException(`${table.tableName} đã được giữ chỗ trước. Vui lòng chọn bàn trống khác.`);
    }

    const resTime = new Date(dto.reservationTime);
    if (isNaN(resTime.getTime())) {
      throw new BadRequestException('Thời gian đặt bàn không hợp lệ.');
    }

    const reservation = new this.reservationModel({
      ...dto,
      reservationTime: resTime,
    });
    const saved = await reservation.save();

    // ⚡ Tự động cập nhật trạng thái bàn sang 'reserved' ngay lập tức trong Database
    await this.tablesService.update(dto.tableId, { status: 'reserved' }).catch(() => {});

    const populated = await this.reservationModel
      .findById(saved._id)
      .populate('tableId', 'tableName status')
      .exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.emitNewReservation(populated);
    }

    return populated || saved;
  }

  async findByPhone(phone: string): Promise<ReservationDocument[]> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return [];
    return this.reservationModel
      .find({ customerPhone: cleanPhone, isDeleted: { $ne: true } })
      .populate('tableId', 'tableName status')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findAll(status?: string): Promise<ReservationDocument[]> {
    await this.syncTableStatusesWithReservations().catch(() => {});
    const filter = status ? { status, isDeleted: { $ne: true } } : { isDeleted: { $ne: true } };
    return this.reservationModel
      .find(filter)
      .populate('tableId', 'tableName status')
      .sort({ reservationTime: -1 })
      .exec();
  }

  async findOne(id: string): Promise<ReservationDocument> {
    const res = await this.reservationModel
      .findById(id)
      .populate('tableId', 'tableName status')
      .exec();
    if (!res || res.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);
    return res;
  }

  async updateStatus(id: string, status: string): Promise<ReservationDocument> {
    const resDoc = await this.reservationModel.findById(id).exec();
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    resDoc.status = status;
    const updated = await resDoc.save();

    const tableId = (updated.tableId as any)?._id || updated.tableId;
    if (tableId) {
      if (status === 'arrived') {
        await this.tablesService.update(tableId.toString(), { status: 'serving' }).catch(() => {});
      } else if (status === 'cancelled') {
        await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
      } else if (status === 'confirmed') {
        await this.tablesService.update(tableId.toString(), { status: 'reserved' }).catch(() => {});
      }
    }

    const populated = await this.reservationModel
      .findById(updated._id)
      .populate('tableId', 'tableName status')
      .exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.emitReservationStatusUpdate(id, status);
    }

    return populated || updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const resDoc = await this.reservationModel.findById(id).exec();
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    const deleted = await this.reservationModel.findByIdAndUpdate(id, { isDeleted: true }, { new: true }).exec();
    if (!deleted) return { message: `Đã xóa đơn đặt bàn thành công.` };
    const tableId = (deleted.tableId as any)?._id || deleted.tableId;
    if (tableId) {
      const table = await this.tablesService.findOne(tableId.toString()).catch(() => null);
      if (table && table.status !== 'serving') {
        await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
        if (this.ordersGateway) {
          this.ordersGateway.emitTableUpdate(tableId.toString(), 'empty');
        }
      }
    }
    if (this.ordersGateway) {
      this.ordersGateway.emitReservationDeleted(id);
    }
    return { message: `Đã xóa đơn đặt bàn thành công.` };
  }

  async customerCancel(id: string): Promise<ReservationDocument> {
    const resDoc = await this.reservationModel.findById(id).exec();
    if (!resDoc) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    if (resDoc.status === 'arrived') {
      throw new BadRequestException('Khách hàng đã đến quán, không thể hủy đơn đặt bàn.');
    }

    resDoc.status = 'cancelled';
    const updated = await resDoc.save();

    const tableId = (updated.tableId as any)?._id || updated.tableId;
    if (tableId) {
      await this.tablesService.update(tableId.toString(), { status: 'empty' }).catch(() => {});
    }

    const populated = await this.reservationModel
      .findById(updated._id)
      .populate('tableId', 'tableName status')
      .exec();

    if (this.ordersGateway && populated) {
      this.ordersGateway.emitReservationStatusUpdate(id, 'cancelled');
    }

    return populated || updated;
  }
}
