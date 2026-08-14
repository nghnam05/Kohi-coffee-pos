import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { OrdersService } from '../../src/orders/orders.service';
import { TablesService } from '../../src/tables/tables.service';
import { OrdersGateway } from '../../src/orders/orders.gateway';
import { FoodsService } from '../../src/foods/foods.service';
import { CouponsService } from '../../src/coupons/coupons.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from '../../src/orders/schemas/order.schema';
import { Food } from '../../src/foods/schemas/food.schema';
import { User } from '../../src/users/schemas/user.schema';

describe('OrdersService', () => {
  let service: OrdersService;
  let tablesService: TablesService;
  let orderModelMock: any;
  let gatewayMock: any;

  const mockOrder = {
    _id: 'order123',
    tableId: '507f1f77bcf86cd799439011',
    status: 'pending',
    items: [{ foodId: 'food001', quantity: 2 }],
    save: jest.fn().mockResolvedValue({
      _id: 'order123',
      tableId: '507f1f77bcf86cd799439011',
      status: 'paid',
    }),
  };

  const mockPaidOrder = {
    ...mockOrder,
    status: 'paid',
    paidAt: new Date(),
  };

  beforeEach(async () => {
    gatewayMock = {
      emitNewOrder: jest.fn(),
      emitStatusUpdate: jest.fn(),
      emitDrinkReadyNotification: jest.fn(),
      emitOrderDeleted: jest.fn(),
      emitTableUpdate: jest.fn(),
      transferGroupCart: jest.fn(),
      server: { emit: jest.fn() },
    };

    orderModelMock = {
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        then: jest.fn().mockImplementation((resolve) => resolve([])),
      }),
      findById: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrder),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrder),
      }),
      findByIdAndDelete: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      }),
      deleteMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ deletedCount: 2 }),
      }),
      updateMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({}),
      }),
      insertMany: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: getModelToken(Order.name), useValue: orderModelMock },
        { provide: getModelToken(Food.name), useValue: {} },
        { provide: getModelToken(User.name), useValue: {} },
        { provide: OrdersGateway, useValue: gatewayMock },
        { provide: FoodsService, useValue: { findOne: jest.fn().mockResolvedValue({ price: 45000 }), findAll: jest.fn().mockResolvedValue([]) } },
        { provide: CouponsService, useValue: { validate: jest.fn(), incrementUsage: jest.fn() } },
        {
          provide: TablesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', status: 'serving' }),
            update: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue([]),
            getOccupantCount: jest.fn().mockReturnValue(0),
          },
        },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
    tablesService = module.get<TablesService>(TablesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // =========================================================
  // updateStatus
  // =========================================================
  describe('updateStatus - 5-Step Pipeline Transition', () => {
    it('should emit drinkReadyNotification when status changes to ready', async () => {
      await service.updateStatus('order123', { status: 'ready' });
      expect(gatewayMock.emitDrinkReadyNotification).toHaveBeenCalled();
    });

    it('should emit drinkReadyNotification when status changes to completed', async () => {
      await service.updateStatus('order123', { status: 'completed' });
      expect(gatewayMock.emitDrinkReadyNotification).toHaveBeenCalled();
    });

    it('should auto-release table to empty when order is paid and no remaining active orders', async () => {
      orderModelMock.countDocuments.mockResolvedValueOnce(0);
      await service.updateStatus('order123', { status: 'paid' });
      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });

    it('should NOT release table if other active orders remain on the same table', async () => {
      (tablesService.getOccupantCount as jest.Mock).mockReturnValueOnce(2);
      await service.updateStatus('order123', { status: 'paid' });
      expect(tablesService.update).not.toHaveBeenCalled();
    });

    it('should emit status update when order status is updated to cancelled', async () => {
      await service.updateStatus('order123', { status: 'cancelled' });
      expect(gatewayMock.emitStatusUpdate).toHaveBeenCalledWith('order123', 'cancelled');
    });

    it('should throw ForbiddenException when barista tries to update status to paid', async () => {
      await expect(service.updateStatus('order123', { status: 'paid' }, 'barista')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when order to update does not exist', async () => {
      orderModelMock.findByIdAndUpdate.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.updateStatus('nonexistent', { status: 'paid' })).rejects.toThrow(NotFoundException);
    });
  });

  // =========================================================
  // remove
  // =========================================================
  describe('remove', () => {
    it('should throw ForbiddenException when barista tries to delete ready/completed/paid order', async () => {
      orderModelMock.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue({ _id: 'order123', status: 'ready' }),
      });
      await expect(service.remove('order123', 'barista')).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException when order does not exist', async () => {
      orderModelMock.findById.mockReturnValueOnce({
        populate: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(null),
      });
      orderModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should emit orderDeleted event after deletion', async () => {
      orderModelMock.countDocuments.mockResolvedValueOnce(0);
      await service.remove('order123');
      expect(gatewayMock.emitOrderDeleted).toHaveBeenCalledWith('order123');
    });

    it('should return success message after deletion', async () => {
      orderModelMock.countDocuments.mockResolvedValueOnce(0);
      const result = await service.remove('order123');
      expect(result.message).toContain('order123');
    });
  });

  // =========================================================
  // removeBulk
  // =========================================================
  describe('removeBulk', () => {
    it('should throw BadRequestException when ids array is empty', async () => {
      await expect(service.removeBulk([])).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when ids is null', async () => {
      await expect(service.removeBulk(null as any)).rejects.toThrow(BadRequestException);
    });

    it('should delete multiple orders and emit events for each', async () => {
      const twoOrders = [
        { _id: { toString: () => 'order1' }, tableId: 'table1', emitOrderDeleted: jest.fn() },
        { _id: { toString: () => 'order2' }, tableId: 'table2', emitOrderDeleted: jest.fn() },
      ];
      orderModelMock.find.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(twoOrders) });
      orderModelMock.deleteMany.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ deletedCount: 2 }) });
      orderModelMock.countDocuments.mockResolvedValue(0);

      const result = await service.removeBulk(['order1', 'order2']);
      expect(result.deletedCount).toBe(2);
      expect(gatewayMock.emitOrderDeleted).toHaveBeenCalledTimes(2);
    });

    it('should return correct deletedCount in response message', async () => {
      orderModelMock.find.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue([mockOrder]) });
      orderModelMock.deleteMany.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({ deletedCount: 1 }) });
      orderModelMock.countDocuments.mockResolvedValueOnce(0);

      const result = await service.removeBulk(['order123']);
      expect(result.deletedCount).toBe(1);
      expect(result.message).toContain('1');
    });
  });

  // =========================================================
  // transferTable
  // =========================================================
  describe('transferTable', () => {
    it('should transfer table status and unsubmitted cart even if no active submitted orders exist', async () => {
      orderModelMock.find.mockResolvedValueOnce([]);
      gatewayMock.transferGroupCart = jest.fn();

      const result = await service.transferTable('tableFrom', 'tableTo');
      expect(tablesService.update).toHaveBeenCalledWith('tableFrom', { status: 'empty' });
      expect(tablesService.update).toHaveBeenCalledWith('tableTo', { status: 'serving' });
      expect(gatewayMock.transferGroupCart).toHaveBeenCalledWith('tableFrom', 'tableTo');
      expect(result.fromTableId).toBe('tableFrom');
      expect(result.toTableId).toBe('tableTo');
    });

    it('should transfer all active orders and update both table statuses', async () => {
      orderModelMock.find.mockResolvedValueOnce([mockOrder]);
      orderModelMock.updateMany.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({}) });

      const result = await service.transferTable('tableFrom', 'tableTo');
      expect(tablesService.update).toHaveBeenCalledWith('tableFrom', { status: 'empty' });
      expect(tablesService.update).toHaveBeenCalledWith('tableTo', { status: 'serving' });
      expect(result.fromTableId).toBe('tableFrom');
      expect(result.toTableId).toBe('tableTo');
    });

    it('should emit tableTransferred socket event after transfer', async () => {
      orderModelMock.find.mockResolvedValueOnce([mockOrder]);
      orderModelMock.updateMany.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue({}) });

      await service.transferTable('tableFrom', 'tableTo');
      expect(gatewayMock.server.emit).toHaveBeenCalledWith('tableTransferred', {
        fromTableId: 'tableFrom',
        toTableId: 'tableTo',
      });
    });
  });

  // =========================================================
  // mergeTableOrders
  // =========================================================
  describe('mergeTableOrders', () => {
    it('should throw BadRequestException if fewer than 2 active orders on table', async () => {
      orderModelMock.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([mockOrder]),
      });
      await expect(service.mergeTableOrders('table123')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if no active orders on table', async () => {
      orderModelMock.find.mockReturnValueOnce({
        sort: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      });
      await expect(service.mergeTableOrders('table123')).rejects.toThrow(BadRequestException);
    });
  });
});
