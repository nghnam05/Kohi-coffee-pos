import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TablesService } from '../../src/tables/tables.service';
import { getModelToken } from '@nestjs/mongoose';
import { Table } from '../../src/tables/schemas/table.schema';
import { Reservation } from '../../src/reservations/schemas/reservation.schema';
import { Order } from '../../src/orders/schemas/order.schema';

describe('TablesService', () => {
  let service: TablesService;
  let tableModelMock: any;
  let reservationModelMock: any;

  const mockTable = {
    _id: '507f1f77bcf86cd799439011',
    tableName: 'Ban so 1',
    status: 'empty',
    capacity: 4,
    save: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', tableName: 'Ban so 1' }),
  };

  beforeEach(async () => {
    tableModelMock = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockTable]),
      }),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockTable),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockTable) }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockTable) }),
    };

    function MockTableModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'newtable001', ...dto });
    }
    MockTableModel.find = (...args: any[]) => tableModelMock.find(...args);
    MockTableModel.findOne = (...args: any[]) => tableModelMock.findOne(...args);
    MockTableModel.findById = (...args: any[]) => tableModelMock.findById(...args);
    MockTableModel.findByIdAndUpdate = (...args: any[]) => tableModelMock.findByIdAndUpdate(...args);
    MockTableModel.findByIdAndDelete = (...args: any[]) => tableModelMock.findByIdAndDelete(...args);

    reservationModelMock = {
      find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([]) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TablesService,
        { provide: getModelToken(Table.name), useValue: MockTableModel },
        { provide: getModelToken(Reservation.name), useValue: reservationModelMock },
        { provide: getModelToken(Order.name), useValue: { countDocuments: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(0) }) } },
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
    if ((service as any).activeOccupantsMap) {
      (service as any).activeOccupantsMap.clear();
    }
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if table with same name already exists', async () => {
      tableModelMock.findOne.mockResolvedValueOnce(mockTable);
      await expect(service.create({ tableName: '1' })).rejects.toThrow(ConflictException);
    });

    it('should normalize table name from number to "Ban so X"', async () => {
      const result = await service.create({ tableName: '5' });
      expect(result).toBeDefined();
    });

    it('should create a table successfully when name is unique', async () => {
      const result = await service.create({ tableName: 'Ban VIP' });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return all tables sorted by tableName', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if table does not exist', async () => {
      tableModelMock.findById.mockReturnValueOnce({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('nonexistentId')).rejects.toThrow(NotFoundException);
    });

    it('should return the table if found', async () => {
      const result = await service.findOne('507f1f77bcf86cd799439011');
      expect(result).toBeDefined();
      expect(result.tableName).toBe('Ban so 1');
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if table to delete does not exist', async () => {
      tableModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('nonexistentId')).rejects.toThrow(NotFoundException);
    });

    it('should delete the table and return a success message', async () => {
      const result = await service.remove('507f1f77bcf86cd799439011');
      expect(result.message).toContain('Ban so 1');
    });
  });

  describe('joinSession & leaveSession (Multi-occupant lifecycle)', () => {
    const tableId = '507f1f77bcf86cd799439011';

    it('should handle 2 occupants joining and leaving sequentially', async () => {
      const join1 = await service.joinSession(tableId, 'device_001');
      expect(join1.occupantCount).toBe(1);

      const join2 = await service.joinSession(tableId, 'device_002');
      expect(join2.occupantCount).toBe(2);

      // Active order count is 1 for leave1, 0 for leave2
      (service as any).orderModel = {
        countDocuments: jest.fn()
          .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(1) })
          .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(0) }),
      };

      const leave1 = await service.leaveSession(tableId, 'device_001');
      expect(leave1.isTableCleared).toBe(false);
      expect(leave1.remainingCount).toBe(1);

      const leave2 = await service.leaveSession(tableId, 'device_002');
      expect(leave2.isTableCleared).toBe(true);
      expect(leave2.remainingCount).toBe(0);
    });
  });
});
