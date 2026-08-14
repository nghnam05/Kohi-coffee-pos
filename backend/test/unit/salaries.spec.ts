import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SalariesService } from '../../src/salaries/salaries.service';
import { getModelToken } from '@nestjs/mongoose';
import { SalaryConfig } from '../../src/salaries/schemas/salary-config.schema';
import { Payroll } from '../../src/salaries/schemas/payroll.schema';
import { AttendanceService } from '../../src/attendance/attendance.service';

describe('SalariesService', () => {
  let service: SalariesService;
  let configModelMock: any;
  let payrollModelMock: any;
  let attendanceServiceMock: any;

  const mockConfig = {
    userId: 'user123',
    type: 'hourly',
    baseSalary: 30000,
    overtimeRate: 1.5,
    standardHoursPerMonth: 176,
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockPayroll = {
    _id: 'payroll123',
    userId: 'user123',
    month: 8,
    year: 2026,
    totalHoursWorked: 100,
    baseSalary: 3000000,
    overtimePay: 0,
    bonuses: 0,
    deductions: 0,
    netSalary: 3000000,
    status: 'draft',
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve({
        ...this,
        populate: jest.fn().mockResolvedValue(this),
      });
    }),
  };

  beforeEach(async () => {
    configModelMock = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'config123' }),
      };
    };
    configModelMock.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockConfig]),
    });
    configModelMock.findOne = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue(mockConfig),
    });
    configModelMock.create = jest.fn().mockResolvedValue(mockConfig);

    payrollModelMock = function (dto: any) {
      return {
        ...dto,
        save: jest.fn().mockResolvedValue({
          ...dto,
          _id: 'payroll123',
          populate: jest.fn().mockResolvedValue(dto),
        }),
      };
    };
    payrollModelMock.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockPayroll]),
    });
    payrollModelMock.findOne = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(null),
    });
    payrollModelMock.findById = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockPayroll),
    });
    payrollModelMock.findByIdAndUpdate = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue({ ...mockPayroll, status: 'paid', paidMethod: 'cash' }),
    });

    attendanceServiceMock = {
      getMonthlySummary: jest.fn().mockResolvedValue({ totalHours: 100, daysWorked: 12.5 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SalariesService,
        { provide: getModelToken(SalaryConfig.name), useValue: configModelMock },
        { provide: getModelToken(Payroll.name), useValue: payrollModelMock },
        { provide: AttendanceService, useValue: attendanceServiceMock },
      ],
    }).compile();

    service = module.get<SalariesService>(SalariesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generatePayroll', () => {
    it('should generate hourly payroll correctly based on attendance hours', async () => {
      const result = await service.generatePayroll('user123', 8, 2026);
      expect(attendanceServiceMock.getMonthlySummary).toHaveBeenCalledWith('user123', '8', '2026');
      expect(result.netSalary).toBe(3000000);
    });
  });

  describe('markPaid', () => {
    it('should update status to paid and record payment method', async () => {
      const result = await service.markPaid('payroll123', 'cash');
      expect(payrollModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        'payroll123',
        expect.objectContaining({ status: 'paid', paidMethod: 'cash' }),
        { new: true },
      );
      expect(result.status).toBe('paid');
    });

    it('should throw NotFoundException if payroll does not exist', async () => {
      payrollModelMock.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.markPaid('invalid', 'cash')).rejects.toThrow(NotFoundException);
    });
  });
});
