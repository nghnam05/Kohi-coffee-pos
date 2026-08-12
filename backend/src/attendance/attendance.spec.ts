import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { getModelToken } from '@nestjs/mongoose';
import { Attendance } from './schemas/attendance.schema';
import { OrdersGateway } from '../orders/orders.gateway';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceModelMock: any;

  const mockUser = { _id: 'user123', name: 'Nhân Viên Thu Ngân', email: 'staff@kohi.vn', role: 'staff' };

  beforeEach(async () => {
    attendanceModelMock = {
      findOne: jest.fn().mockImplementation(({ userId }) => ({
        exec: jest.fn().mockResolvedValue(null),
      })),
      findById: jest.fn().mockImplementation((id: string) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({
          _id: id,
          userId: mockUser,
          date: new Date(),
          checkIn: new Date(),
        }),
      })),
    };

    // Constructor mock for new this.attendanceModel(...)
    function MockAttendanceModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'att123', ...dto });
    }
    Object.assign(MockAttendanceModel, attendanceModelMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        {
          provide: getModelToken(Attendance.name),
          useValue: MockAttendanceModel,
        },
        {
          provide: OrdersGateway,
          useValue: { emitAttendanceUpdate: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('should create checkIn record if user has not checked in today', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      const record = await service.checkIn('user123');
      expect(record).toBeDefined();
      expect(record.userId).toEqual(mockUser);
    });

    it('should throw BadRequestException if user already checked in today', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({ _id: 'att123', checkIn: new Date(), checkOut: null }),
      }));

      await expect(service.checkIn('user123')).rejects.toThrow(BadRequestException);
    });
  });

  describe('checkOut', () => {
    it('should throw NotFoundException if user has not checked in today', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(null),
      }));

      await expect(service.checkOut('user123')).rejects.toThrow(NotFoundException);
    });

    it('should calculate totalHours correctly when checkOut succeeds', async () => {
      const checkInTime = new Date(Date.now() - 4 * 3600 * 1000); // 4 hours ago
      const mockRecord = {
        _id: 'att123',
        checkIn: checkInTime,
        checkOut: null,
        totalHours: 0,
        save: jest.fn().mockImplementation(function (this: any) {
          return Promise.resolve(this);
        }),
      };

      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue(mockRecord),
      }));

      const result = await service.checkOut('user123');
      expect(result).toBeDefined();
      expect(mockRecord.totalHours).toBeGreaterThanOrEqual(3.9);
      expect(mockRecord.totalHours).toBeLessThanOrEqual(4.1);
    });
  });
});
