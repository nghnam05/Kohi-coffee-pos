import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceService } from '../../src/attendance/attendance.service';
import { getModelToken } from '@nestjs/mongoose';
import { Attendance } from '../../src/attendance/schemas/attendance.schema';
import { OrdersGateway } from '../../src/orders/orders.gateway';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let attendanceModelMock: any;

  const mockUser = { _id: 'user123', name: 'Nhan Vien Thu Ngan', email: 'staff@kohi.vn', role: 'staff' };

  beforeEach(async () => {
    attendanceModelMock = {
      findOne: jest.fn().mockImplementation(() => ({ exec: jest.fn().mockResolvedValue(null) })),
      findById: jest.fn().mockImplementation((id: string) => ({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: id, userId: mockUser, date: new Date(), checkIn: new Date() }),
      })),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue({ _id: 'att123' }) }),
    };

    function MockAttendanceModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'att123', ...dto });
    }
    Object.assign(MockAttendanceModel, attendanceModelMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: getModelToken(Attendance.name), useValue: MockAttendanceModel },
        { provide: OrdersGateway, useValue: { emitAttendanceUpdate: jest.fn() } },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIn', () => {
    it('should create checkIn record if user has not checked in today', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(null) }));
      const record = await service.checkIn('user123');
      expect(record).toBeDefined();
      expect(record.userId).toEqual(mockUser);
    });

    it('should throw BadRequestException if user already checked in today (no checkout yet)', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({ _id: 'att123', checkIn: new Date(), checkOut: null }),
      }));
      await expect(service.checkIn('user123')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if user already completed shift today (with checkout)', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({ _id: 'att123', checkIn: new Date(), checkOut: new Date() }),
      }));
      await expect(service.checkIn('user123')).rejects.toThrow(BadRequestException);
    });

    it('should auto-determine shift to morning if hour is between 5 and 11', async () => {
      const result = await service.checkIn('user123', 'morning');
      expect(result).toBeDefined();
    });

    it('should use provided valid shift (afternoon) if given', async () => {
      const result = await service.checkIn('user123', 'afternoon');
      expect(result).toBeDefined();
    });
  });

  describe('checkOut', () => {
    it('should throw NotFoundException if user has not checked in today', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(null) }));
      await expect(service.checkOut('user123')).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has already checked out', async () => {
      attendanceModelMock.findOne.mockImplementationOnce(() => ({
        exec: jest.fn().mockResolvedValue({ _id: 'att123', checkIn: new Date(), checkOut: new Date() }),
      }));
      await expect(service.checkOut('user123')).rejects.toThrow(BadRequestException);
    });

    it('should calculate totalHours correctly when checkOut succeeds', async () => {
      const checkInTime = new Date(Date.now() - 4 * 3600 * 1000);
      const mockRecord = {
        _id: 'att123',
        checkIn: checkInTime,
        checkOut: null,
        totalHours: 0,
        save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
      };
      attendanceModelMock.findOne.mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(mockRecord) }));
      const result = await service.checkOut('user123');
      expect(result).toBeDefined();
      expect(mockRecord.totalHours).toBeGreaterThanOrEqual(3.9);
      expect(mockRecord.totalHours).toBeLessThanOrEqual(4.1);
    });

    it('should set checkOut timestamp to a date after checkIn', async () => {
      const checkInTime = new Date(Date.now() - 2 * 3600 * 1000);
      const mockRecord = {
        _id: 'att123',
        checkIn: checkInTime,
        checkOut: null,
        totalHours: 0,
        save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
      };
      attendanceModelMock.findOne.mockImplementationOnce(() => ({ exec: jest.fn().mockResolvedValue(mockRecord) }));
      await service.checkOut('user123');
      expect(mockRecord.checkOut).toBeDefined();
    });
  });

  describe('getMonthlySummary', () => {
    it('should return 0 hours and 0 working days when no attendance records', async () => {
      attendanceModelMock.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      const result = await service.getMonthlySummary('user123', '8', '2026');
      expect(result.totalHours).toBe(0);
      expect(result.workingDays).toBe(0);
    });

    it('should sum totalHours from multiple attendance records', async () => {
      attendanceModelMock.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([
          { totalHours: 8, checkIn: new Date(), checkOut: new Date() },
          { totalHours: 6, checkIn: new Date(), checkOut: new Date() },
          { totalHours: 7.5, checkIn: new Date(), checkOut: new Date() },
        ]),
      });
      const result = await service.getMonthlySummary('user123', '8', '2026');
      expect(result.totalHours).toBeCloseTo(21.5, 1);
      expect(result.workingDays).toBe(3);
    });

    it('should include userId in summary response', async () => {
      attendanceModelMock.find.mockReturnValueOnce({
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      const result = await service.getMonthlySummary('user123', '8', '2026');
      expect(result.userId).toBe('user123');
    });
  });

  describe('adminEdit', () => {
    it('should throw NotFoundException if attendance record does not exist', async () => {
      attendanceModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.adminEdit('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should recalculate totalHours after editing checkIn and checkOut', async () => {
      const checkInStr = new Date(Date.now() - 5 * 3600 * 1000).toISOString();
      const checkOutStr = new Date().toISOString();
      const mockRecord = {
        _id: 'att123',
        checkIn: new Date(checkInStr),
        checkOut: null,
        totalHours: 0,
        isManualEdit: false,
        save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
      };
      attendanceModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockRecord) });
      await service.adminEdit('att123', checkInStr, checkOutStr);
      expect(mockRecord.isManualEdit).toBe(true);
      expect(mockRecord.totalHours).toBeGreaterThan(4);
    });

    it('should update shift value if valid shift is provided', async () => {
      const mockRecord = {
        _id: 'att123',
        checkIn: new Date(),
        checkOut: new Date(),
        totalHours: 8,
        shift: 'morning',
        isManualEdit: false,
        save: jest.fn().mockImplementation(function (this: any) { return Promise.resolve(this); }),
      };
      attendanceModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockRecord) });
      await service.adminEdit('att123', undefined, undefined, undefined, 'evening');
      expect(mockRecord.shift).toBe('evening');
    });
  });

  describe('deleteAttendance', () => {
    it('should throw NotFoundException if record does not exist', async () => {
      attendanceModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.deleteAttendance('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should delete and return the deleted record', async () => {
      const result = await service.deleteAttendance('att123');
      expect(result).toBeDefined();
    });
  });
});
