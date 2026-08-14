import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ReservationsService } from '../../src/reservations/reservations.service';
import { TablesService } from '../../src/tables/tables.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reservation } from '../../src/reservations/schemas/reservation.schema';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let tablesService: TablesService;
  let reservationModelMock: any;

  const mockTable = {
    _id: '507f1f77bcf86cd799439011',
    tableName: 'Ban so 1',
    status: 'empty',
  };

  const mockPendingReservation = {
    _id: 'res123',
    tableId: '507f1f77bcf86cd799439011',
    status: 'pending',
    save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve({ ...this }); }),
  };

  const mockArrivedReservation = {
    _id: 'res456',
    tableId: '507f1f77bcf86cd799439011',
    status: 'arrived',
    save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve({ ...this }); }),
  };

  beforeEach(async () => {
    reservationModelMock = {
      countDocuments: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(
          id === 'res456' ? mockArrivedReservation : mockPendingReservation,
        ),
        populate: jest.fn().mockReturnThis(),
      })),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ _id: 'res123', tableId: '507f1f77bcf86cd799439011' }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationsService,
        { provide: getModelToken(Reservation.name), useValue: reservationModelMock },
        {
          provide: TablesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue(mockTable),
            update: jest.fn().mockResolvedValue({ ...mockTable, status: 'reserved' }),
            findAll: jest.fn().mockResolvedValue([mockTable]),
          },
        },
      ],
    }).compile();

    service = module.get<ReservationsService>(ReservationsService);
    tablesService = module.get<TablesService>(TablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create - Double Booking Prevention', () => {
    it('should throw BadRequestException if table is currently serving', async () => {
      jest.spyOn(tablesService, 'findOne').mockResolvedValueOnce({ ...mockTable, status: 'serving' });
      await expect(
        service.create({ tableId: '507f1f77bcf86cd799439011', customerName: 'Nguyen Van A', customerPhone: '0901234567', guestCount: 2, reservationTime: new Date().toISOString(), note: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if table has an active reservation', async () => {
      reservationModelMock.findOne.mockResolvedValueOnce({ _id: 'existing_res', status: 'pending' });
      await expect(
        service.create({ tableId: '507f1f77bcf86cd799439011', customerName: 'Tran Thi B', customerPhone: '0987654321', guestCount: 4, reservationTime: new Date().toISOString(), note: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if table status is already reserved', async () => {
      jest.spyOn(tablesService, 'findOne').mockResolvedValueOnce({ ...mockTable, status: 'reserved' });
      await expect(
        service.create({ tableId: '507f1f77bcf86cd799439011', customerName: 'Le Van C', customerPhone: '0912345678', guestCount: 2, reservationTime: new Date().toISOString(), note: '' }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('customerCancel', () => {
    it('should update reservation status to cancelled and table status to empty', async () => {
      reservationModelMock.findById.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({
          ...mockPendingReservation,
          populate: jest.fn().mockReturnThis(),
        }),
        populate: jest.fn().mockReturnThis(),
      });
      reservationModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockPendingReservation, status: 'cancelled' }),
      });
      await service.customerCancel('res123');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });

    it('should throw BadRequestException if customer is already arrived', async () => {
      await expect(service.customerCancel('res456')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if reservation does not exist', async () => {
      reservationModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null), populate: jest.fn().mockReturnThis() });
      await expect(service.customerCancel('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove - arrived guard', () => {
    it('should throw BadRequestException when trying to delete an arrived reservation', async () => {
      await expect(service.remove('res456')).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException when reservation does not exist', async () => {
      reservationModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null), populate: jest.fn().mockReturnThis() });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should delete reservation and release table to empty when status is pending', async () => {
      await service.remove('res123');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });
  });

  describe('updateStatus - table side effects', () => {
    it('should update table to serving when reservation status changes to arrived', async () => {
      reservationModelMock.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockPendingReservation), populate: jest.fn().mockReturnThis() })
        .mockReturnValue({ populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ ...mockPendingReservation, status: 'arrived' }) });

      await service.updateStatus('res123', 'arrived');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'serving' });
    });

    it('should update table to empty when reservation is cancelled', async () => {
      reservationModelMock.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockPendingReservation), populate: jest.fn().mockReturnThis() })
        .mockReturnValue({ populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ ...mockPendingReservation, status: 'cancelled' }) });

      await service.updateStatus('res123', 'cancelled');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });

    it('should update table to reserved when reservation is confirmed', async () => {
      reservationModelMock.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockPendingReservation), populate: jest.fn().mockReturnThis() })
        .mockReturnValue({ populate: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue({ ...mockPendingReservation, status: 'confirmed' }) });

      await service.updateStatus('res123', 'confirmed');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'reserved' });
    });

    it('should throw NotFoundException if reservation not found', async () => {
      reservationModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null), populate: jest.fn().mockReturnThis() });
      await expect(service.updateStatus('nonexistent', 'confirmed')).rejects.toThrow(NotFoundException);
    });
  });
});
