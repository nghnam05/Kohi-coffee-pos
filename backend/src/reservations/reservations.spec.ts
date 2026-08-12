import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { TablesService } from '../tables/tables.service';
import { getModelToken } from '@nestjs/mongoose';
import { Reservation } from './schemas/reservation.schema';

describe('ReservationsService', () => {
  let service: ReservationsService;
  let tablesService: TablesService;
  let reservationModelMock: any;

  const mockTable = {
    _id: '507f1f77bcf86cd799439011',
    tableName: 'Bàn số 1',
    status: 'empty',
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
          id === 'res456'
            ? { _id: 'res456', status: 'arrived' }
            : {
                _id: 'res123',
                tableId: '507f1f77bcf86cd799439011',
                status: 'pending',
                save: jest.fn().mockResolvedValue({
                  _id: 'res123',
                  tableId: '507f1f77bcf86cd799439011',
                  status: 'cancelled',
                }),
              }
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
        {
          provide: getModelToken(Reservation.name),
          useValue: reservationModelMock,
        },
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
      jest.spyOn(tablesService, 'findOne').mockResolvedValueOnce({
        ...mockTable,
        status: 'serving',
      });

      await expect(
        service.create({
          tableId: '507f1f77bcf86cd799439011',
          customerName: 'Nguyễn Văn A',
          customerPhone: '0901234567',
          guestCount: 2,
          reservationTime: new Date().toISOString(),
          note: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if table has an active reservation', async () => {
      reservationModelMock.findOne.mockResolvedValueOnce({
        _id: 'existing_res',
        status: 'pending',
      });

      await expect(
        service.create({
          tableId: '507f1f77bcf86cd799439011',
          customerName: 'Trần Thị B',
          customerPhone: '0987654321',
          guestCount: 4,
          reservationTime: new Date().toISOString(),
          note: '',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('customerCancel', () => {
    it('should update reservation status to cancelled and table status to empty', async () => {
      await service.customerCancel('res123');
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });

    it('should throw BadRequestException if customer is already arrived', async () => {
      await expect(service.customerCancel('res456')).rejects.toThrow(BadRequestException);
    });
  });
});
