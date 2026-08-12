import { Test, TestingModule } from '@nestjs/testing';
import { TablesService } from './tables.service';
import { getModelToken } from '@nestjs/mongoose';
import { Table } from './schemas/table.schema';
import { Reservation } from '../reservations/schemas/reservation.schema';

describe('TablesService', () => {
  let service: TablesService;
  let tableModelMock: any;
  let reservationModelMock: any;

  const mockTable = {
    _id: '507f1f77bcf86cd799439011',
    tableName: 'Bàn số 1',
    status: 'empty',
  };

  beforeEach(async () => {
    tableModelMock = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockTable]),
        }),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(mockTable),
        }),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockTable, status: 'reserved' }),
      }),
    };

    reservationModelMock = {
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([
            { tableId: '507f1f77bcf86cd799439011', status: 'pending' },
          ]),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        {
          provide: getModelToken(Table.name),
          useValue: tableModelMock,
        },
        {
          provide: getModelToken(Reservation.name),
          useValue: reservationModelMock,
        },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should auto-sync table status to reserved if active reservation exists', async () => {
      const tables = await service.findAll();
      expect(tables[0].status).toBe('reserved');
      expect(tableModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        '507f1f77bcf86cd799439011',
        { status: 'reserved' },
      );
    });
  });
});
