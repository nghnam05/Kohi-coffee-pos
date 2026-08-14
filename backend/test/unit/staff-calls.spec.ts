import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { StaffCallsService } from '../../src/staff-calls/staff-calls.service';
import { getModelToken } from '@nestjs/mongoose';
import { StaffCall } from '../../src/staff-calls/schemas/staff-call.schema';

describe('StaffCallsService', () => {
  let service: StaffCallsService;
  let staffCallModelMock: any;

  const mockCall = {
    _id: 'call123',
    tableId: 'table001',
    message: 'Cần khăn giấy',
    status: 'pending',
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  beforeEach(async () => {
    staffCallModelMock = function (dto: any) {
      return {
        ...dto,
        _id: 'call123',
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'call123' }),
      };
    };

    staffCallModelMock.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockCall]),
    });
    staffCallModelMock.findById = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockCall),
    });
    staffCallModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ ...mockCall, status: 'acknowledged' }),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffCallsService,
        { provide: getModelToken(StaffCall.name), useValue: staffCallModelMock },
      ],
    }).compile();

    service = module.get<StaffCallsService>(StaffCallsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createCall', () => {
    it('should create staff call successfully', async () => {
      const result = await service.createCall({ tableId: 'table001', message: 'Cần nước đá' });
      expect(result).toBeDefined();
    });

    it('should enforce 30s cooldown for consecutive non-payment calls from same table', async () => {
      await service.createCall({ tableId: 'table002', message: 'Cần đũa' });
      await expect(
        service.createCall({ tableId: 'table002', message: 'Cần thìa' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should bypass 30s cooldown if message contains thanh toán', async () => {
      await service.createCall({ tableId: 'table003', message: 'Gọi nhân viên' });
      const payCall = await service.createCall({ tableId: 'table003', message: 'Muốn thanh toán' });
      expect(payCall).toBeDefined();
    });
  });

  describe('acknowledge', () => {
    it('should acknowledge staff call successfully', async () => {
      const result = await service.acknowledge('call123');
      expect(result.status).toBe('acknowledged');
    });

    it('should throw NotFoundException if staff call ID does not exist', async () => {
      staffCallModelMock.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.acknowledge('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
