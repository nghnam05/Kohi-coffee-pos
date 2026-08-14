import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { ShiftSwapsService } from '../../src/shift-swaps/shift-swaps.service';
import { getModelToken } from '@nestjs/mongoose';
import { ShiftSwapRequest } from '../../src/shift-swaps/schemas/shift-swap.schema';
import { User } from '../../src/users/schemas/user.schema';
import { OrdersGateway } from '../../src/orders/orders.gateway';

describe('ShiftSwapsService', () => {
  let service: ShiftSwapsService;
  let swapModelMock: any;
  let userModelMock: any;

  const mockUser = {
    _id: 'user123',
    name: 'Pham Thi B',
    email: 'staff@kohi.vn',
    role: 'waiter',
    assignedShift: 'morning',
  };

  const mockSwapRequest = {
    _id: 'swap001',
    userId: mockUser,
    currentShift: 'morning',
    requestedShift: 'afternoon',
    reason: 'Ly do chuyen ca',
    status: 'pending',
    save: jest.fn().mockResolvedValue({
      _id: 'swap001',
      userId: 'user123',
      currentShift: 'morning',
      requestedShift: 'afternoon',
      status: 'approved',
    }),
  };

  beforeEach(async () => {
    swapModelMock = {
      findOne: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockSwapRequest) }),
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockSwapRequest]),
      }),
    };

    function MockSwapModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'swap001', ...dto });
    }
    Object.assign(MockSwapModel, swapModelMock);

    userModelMock = {
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ShiftSwapsService,
        { provide: getModelToken(ShiftSwapRequest.name), useValue: MockSwapModel },
        { provide: getModelToken(User.name), useValue: userModelMock },
        { provide: OrdersGateway, useValue: { server: { emit: jest.fn() } } },
      ],
    }).compile();

    service = module.get<ShiftSwapsService>(ShiftSwapsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      userModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(
        service.create('nonexistent', { requestedShift: 'afternoon', reason: '' }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if requested shift equals current shift', async () => {
      await expect(
        service.create('user123', { requestedShift: 'morning', reason: '' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if employee already has a pending request', async () => {
      swapModelMock.findOne.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue({ _id: 'existing_swap', status: 'pending' }),
      });
      await expect(
        service.create('user123', { requestedShift: 'evening', reason: '' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create a shift swap request successfully', async () => {
      swapModelMock.findById.mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ ...mockSwapRequest, userId: mockUser }),
      });
      const result = await service.create('user123', { requestedShift: 'afternoon', reason: 'Hop gia dinh' });
      expect(result).toBeDefined();
    });
  });

  describe('updateStatus', () => {
    it('should throw BadRequestException for invalid status values', async () => {
      await expect(
        service.updateStatus('swap001', 'invalid_status' as any, 'admin001'),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if swap request does not exist', async () => {
      swapModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(
        service.updateStatus('notfound', 'approved', 'admin001'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should update user assignedShift when status is approved', async () => {
      swapModelMock.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockSwapRequest) })
        .mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({ ...mockSwapRequest, status: 'approved' }),
        });

      await service.updateStatus('swap001', 'approved', 'admin001');
      expect(userModelMock.findByIdAndUpdate).toHaveBeenCalledWith(
        mockSwapRequest.userId,
        { assignedShift: 'afternoon' },
      );
    });

    it('should NOT update user assignedShift when status is rejected', async () => {
      swapModelMock.findById
        .mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockSwapRequest) })
        .mockReturnValue({
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({ ...mockSwapRequest, status: 'rejected' }),
        });

      await service.updateStatus('swap001', 'rejected', 'admin001');
      expect(userModelMock.findByIdAndUpdate).not.toHaveBeenCalled();
    });
  });

  describe('findMy', () => {
    it('should return shift swap requests for a specific user', async () => {
      const result = await service.findMy('user123');
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('findAll', () => {
    it('should return all shift swap requests (Admin only)', async () => {
      swapModelMock.find.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockSwapRequest]),
      });
      const result = await service.findAll();
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });
});
