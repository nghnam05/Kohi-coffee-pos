import {
  Injectable, NotFoundException, BadRequestException, OnModuleInit, Optional, Inject,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Reservation, ReservationDocument } from './schemas/reservation.schema.js';
import { CreateReservationDto } from './dto/create-reservation.dto.js';
import { TablesService } from '../tables/tables.service.js';
import { OrdersGateway } from '../orders/orders.gateway.js';
import { getVietnamTime } from '../common/time.util.js';

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
    if (!table) throw new NotFoundException('Không tìm thấy bàn được chọn.');

    // ⚡ 1. Bàn đang có khách hoặc đã giữ chỗ thì không cho đặt
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

    // ⚡ 2. Ràng buộc 1 SĐT chỉ được có 1 đơn đặt bàn đang hoạt động
    const cleanPhone = dto.customerPhone.trim();
    const activeResByPhone = await this.reservationModel.findOne({
      customerPhone: cleanPhone,
      status: { $in: ['pending', 'confirmed'] },
      isDeleted: { $ne: true },
    });
    if (activeResByPhone) {
      throw new BadRequestException('Số điện thoại này đã có 1 đơn đặt bàn đang chờ hoặc đã xác nhận. Không thể đặt thêm bàn khác.');
    }

    // ⚡ 3. Ràng buộc thời gian chờ 30 phút sau khi hủy đặt bàn
    const recentCancelledRes = await this.reservationModel
      .findOne({
        customerPhone: cleanPhone,
        status: 'cancelled',
        cancelledAt: { $ne: null },
        isDeleted: { $ne: true },
      })
      .sort({ cancelledAt: -1 })
      .exec();

    if (recentCancelledRes && recentCancelledRes.cancelledAt) {
      const timeSinceCancelMs = Date.now() - new Date(recentCancelledRes.cancelledAt).getTime();
      const timeSinceCancelMins = timeSinceCancelMs / (1000 * 60);
      if (timeSinceCancelMins < 30) {
        const remainingMins = Math.ceil(30 - timeSinceCancelMins);
        throw new BadRequestException(
          `Bạn vừa hủy đặt bàn gần đây. Vui lòng chờ ${remainingMins} phút nữa để thực hiện đặt lại.`,
        );
      }
    }

    // ⚡ 4. Ràng buộc thời gian hẹn và Giờ hoạt động của quán (06:00 - 23:00)
    const resTime = new Date(dto.reservationTime);
    if (isNaN(resTime.getTime())) {
      throw new BadRequestException('Thời gian đặt bàn không hợp lệ.');
    }

    if (resTime.getTime() < Date.now() - 5 * 60 * 1000) {
      throw new BadRequestException('Thời gian đặt bàn phải ở thời điểm tương lai.');
    }

    const vnRes = getVietnamTime(resTime);
    const hours = vnRes.hour;
    const minutes = vnRes.minute;
    if (hours < 7 || hours > 22 || (hours === 22 && minutes > 0)) {
      throw new BadRequestException('Thời gian đặt bàn phải nằm trong khung giờ hoạt động của quán (07:00 - 22:00).');
    }

    const reservation = new this.reservationModel({
      ...dto,
      customerPhone: cleanPhone,
      reservationTime: resTime,
    });
    const saved = await reservation.save();

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

  async findByPhone(phone: string): Promise<any[]> {
    const cleanPhone = phone.trim();
    if (!cleanPhone) return [];
    const list = await this.reservationModel
      .find({ customerPhone: cleanPhone, isDeleted: { $ne: true } })
      .populate('tableId', 'tableName status')
      .sort({ createdAt: -1 })
      .lean()
      .exec();

    // Mã nhận bàn chỉ hiển thị 1 lần: Nếu đã xem rồi (isCodeViewed === true), ẩn mã khi tra cứu
    return list.map((item: any) => {
      if (item.isCodeViewed) {
        return {
          ...item,
          checkInCode: null,
        };
      }
      return item;
    });
  }

  async markCodeViewed(id: string): Promise<{ success: boolean; message: string }> {
    const resDoc = await this.reservationModel.findById(id).exec();
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    resDoc.isCodeViewed = true;
    await resDoc.save();

    return { success: true, message: 'Đã đánh dấu khách đã xem mã nhận bàn.' };
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

    if (status === 'confirmed') {
      if (!resDoc.checkInCode) {
        // Sinh mã ngẫu nhiên 4 chữ số từ 1000 đến 9999
        resDoc.checkInCode = Math.floor(1000 + Math.random() * 9000).toString();
      }
      resDoc.isCodeViewed = false;
      resDoc.status = 'confirmed';
    } else {
      resDoc.status = status;
    }

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
      this.ordersGateway.emitReservationStatusUpdate(id, status, {
        checkInCode: populated.checkInCode,
        reservation: populated,
      });
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
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    if (resDoc.status === 'arrived') {
      throw new BadRequestException('Khách hàng đã đến quán, không thể hủy đơn đặt bàn.');
    }

    const resTime = new Date(resDoc.reservationTime).getTime();
    const diffMinutes = (resTime - Date.now()) / (1000 * 60);
    if (diffMinutes <= 30) {
      throw new BadRequestException(
        'Chỉ được phép tự hủy bàn trước thời gian hẹn ít nhất 30 phút. Vui lòng liên hệ nhân viên để được hỗ trợ.',
      );
    }

    resDoc.status = 'cancelled';
    resDoc.cancelledAt = new Date();
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

  async customerArrive(id: string, checkInCode?: string, newTableId?: string): Promise<any> {
    const resDoc = await this.reservationModel.findById(id).populate('tableId').exec();
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    if (resDoc.status === 'cancelled') {
      throw new BadRequestException('Đơn đặt bàn này đã bị hủy.');
    }

    if (resDoc.status === 'pending') {
      throw new BadRequestException(
        'Đơn đặt bàn đang chờ nhân viên phục vụ duyệt. Vui lòng đợi nhân viên xác nhận trước khi nhận bàn.',
      );
    }

    // Nếu đơn có mã PIN 4 chữ số, yêu cầu khách hàng nhập đúng mã
    if (resDoc.checkInCode) {
      const inputCode = (checkInCode || '').trim();
      if (!inputCode || inputCode !== resDoc.checkInCode.trim()) {
        throw new BadRequestException('Mã nhận bàn không chính xác. Vui lòng kiểm tra lại!');
      }
    }

    const currentTableIdStr = (resDoc.tableId as any)?._id
      ? (resDoc.tableId as any)._id.toString()
      : resDoc.tableId?.toString();

    const currentTable = currentTableIdStr
      ? await this.tablesService.findOne(currentTableIdStr).catch(() => null)
      : null;

    // Kiểm tra nếu khách đến sớm mà bàn hiện tại đang có khách (status === 'serving')
    if (currentTable && currentTable.status === 'serving') {
      if (newTableId) {
        const targetTable = await this.tablesService.findOne(newTableId).catch(() => null);
        if (!targetTable || targetTable.status !== 'empty') {
          throw new BadRequestException('Bàn bạn chọn không còn trống. Vui lòng chọn bàn khác.');
        }

        // Đổi bàn cho đơn đặt bàn
        resDoc.tableId = new Types.ObjectId(newTableId) as any;
        resDoc.status = 'arrived';
        await resDoc.save();

        await this.tablesService.update(newTableId, { status: 'serving' }).catch(() => {});
        if (this.ordersGateway) {
          this.ordersGateway.emitTableUpdate(newTableId, 'serving');
          this.ordersGateway.emitReservationStatusUpdate(id, 'arrived');
        }

        return {
          success: true,
          message: `Đã chuyển sang ${targetTable.tableName} và vào bàn thành công!`,
          tableId: newTableId,
          tableName: targetTable.tableName,
        };
      }

      // Khách chưa chọn bàn mới: Lọc danh sách bàn trống có sức chứa phù hợp để gợi ý
      const allTables = await this.tablesService.findAll().catch(() => []);
      const suggestedTables = (allTables || [])
        .filter(
          (t: any) =>
            t._id?.toString() !== currentTableIdStr &&
            t.status === 'empty' &&
            (t.capacity || 2) >= (resDoc.guestCount || 1),
        )
        .sort((a: any, b: any) => (a.capacity || 2) - (b.capacity || 2));

      return {
        success: false,
        statusCode: 'TABLE_OCCUPIED',
        message: `Bàn ${currentTable.tableName} hiện đang có khách ngồi trước giờ hẹn của bạn.`,
        currentTable: {
          _id: currentTable._id,
          tableName: currentTable.tableName,
          status: currentTable.status,
        },
        suggestedTables: suggestedTables.map((t: any) => ({
          _id: t._id,
          tableName: t.tableName,
          capacity: t.capacity,
          status: t.status,
        })),
      };
    }

    // Trường hợp bàn đang trống hoặc giữ chỗ của chính đơn này
    resDoc.status = 'arrived';
    await resDoc.save();

    if (currentTableIdStr) {
      await this.tablesService.update(currentTableIdStr, { status: 'serving' }).catch(() => {});
      if (this.ordersGateway) {
        this.ordersGateway.emitTableUpdate(currentTableIdStr, 'serving');
        this.ordersGateway.emitReservationStatusUpdate(id, 'arrived');
      }
    }

    return {
      success: true,
      message: 'Xác nhận đã đến quán thành công!',
      tableId: currentTableIdStr,
      tableName: (resDoc.tableId as any)?.tableName || 'Bàn',
    };
  }

  async cancelLateReservation(id: string): Promise<ReservationDocument> {
    const resDoc = await this.reservationModel.findById(id).exec();
    if (!resDoc || resDoc.isDeleted) throw new NotFoundException(`Không tìm thấy đơn đặt bàn ID: ${id}`);

    if (resDoc.status === 'arrived') {
      throw new BadRequestException('Khách hàng đã đến quán, không thể hủy đơn đặt bàn.');
    }

    const resTime = new Date(resDoc.reservationTime).getTime();
    const diffMinutes = (Date.now() - resTime) / (1000 * 60);
    if (diffMinutes < 30) {
      throw new BadRequestException(
        `Đơn đặt bàn chưa quá giờ hẹn 30 phút (Hiện tại chỉ mới quá ${Math.max(0, Math.floor(diffMinutes))} phút).`,
      );
    }

    resDoc.status = 'cancelled';
    resDoc.cancelledAt = new Date();
    resDoc.note = (resDoc.note ? resDoc.note + ' | ' : '') + 'Phục vụ hủy do trễ quá 30 phút';
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
