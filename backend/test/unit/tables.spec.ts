import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TablesService } from '../../src/tables/tables.service';
import { getModelToken } from '@nestjs/mongoose';
import { Table } from '../../src/tables/schemas/table.schema';
import { Reservation } from '../../src/reservations/schemas/reservation.schema';

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
      find: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([mockTable]) }),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue(mockTable) }),
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
      ],
    }).compile();

    service = module.get<TablesService>(TablesService);
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
    it('should return all tables without changing status when no reservations', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should mark table as reserved if it has an active pending reservation', async () => {
      reservationModelMock.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { tableId: { toString: () => '507f1f77bcf86cd799439011' } },
        ]),
      });
      const result = await service.findAll();
      expect(result[0].status).toBe('reserved');
    });

    it('should NOT change table status to reserved if table is already serving', async () => {
      const servingTable = { ...mockTable, status: 'serving', _id: { toString: () => '507f1f77bcf86cd799439011' } };
      tableModelMock.find.mockReturnValueOnce({ lean: jest.fn().mockReturnThis(), exec: jest.fn().mockResolvedValue([servingTable]) });
      reservationModelMock.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([{ tableId: { toString: () => '507f1f77bcf86cd799439011' } }]),
      });
      const result = await service.findAll();
      expect(result[0].status).toBe('serving');
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
      // 1. Person 1 joins table with device 1
      const join1 = await service.joinSession(tableId, 'device_001');
      expect(join1.occupantCount).toBe(1);

      // 2. Person 2 joins table with device 2
      const join2 = await service.joinSession(tableId, 'device_002');
      expect(join2.occupantCount).toBe(2);

      // 3. Person 1 leaves table -> remaining count should be 1
      const leave1 = await service.leaveSession(tableId, 'device_001');
      expect(leave1.isTableCleared).toBe(false);
      expect(leave1.remainingCount).toBe(1);

      // 4. Person 2 leaves table -> remaining count should be 0, isTableCleared should be true
      const leave2 = await service.leaveSession(tableId, 'device_002');
      expect(leave2.isTableCleared).toBe(true);
      expect(leave2.remainingCount).toBe(0);
    });

    it('should NOT clear table if 2 people leave but there is still an active unpaid order', async () => {
      // Mock orderModel returning active orders > 0
      (service as any).orderModel = {
        countDocuments: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue(1), // 1 active order
        }),
      };

      await service.joinSession(tableId, 'device_A');
      await service.joinSession(tableId, 'device_B');

      await service.leaveSession(tableId, 'device_A');
      const leaveB = await service.leaveSession(tableId, 'device_B');

      // Remaining count is 0, but isTableCleared is false because active order exists
      expect(leaveB.remainingCount).toBe(0);
      expect(leaveB.isTableCleared).toBe(false);
    });
  });
});
