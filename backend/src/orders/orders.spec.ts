import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { TablesService } from '../tables/tables.service';
import { OrdersGateway } from './orders.gateway';
import { FoodsService } from '../foods/foods.service';
import { CouponsService } from '../coupons/coupons.service';
import { getModelToken } from '@nestjs/mongoose';
import { Order } from './schemas/order.schema';
import { Food } from '../foods/schemas/food.schema';
import { User } from '../users/schemas/user.schema';

describe('OrdersService', () => {
  let service: OrdersService;
  let tablesService: TablesService;
  let orderModelMock: any;

  const mockOrder = {
    _id: 'order123',
    tableId: '507f1f77bcf86cd799439011',
    status: 'pending',
    save: jest.fn().mockResolvedValue({
      _id: 'order123',
      tableId: '507f1f77bcf86cd799439011',
      status: 'paid',
    }),
  };

  beforeEach(async () => {
    orderModelMock = {
      countDocuments: jest.fn().mockResolvedValue(0),
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
        populate: jest.fn().mockReturnThis(),
        sort: jest.fn().mockReturnThis(),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockOrder),
      }),
      findByIdAndUpdate: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(mockOrder),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        {
          provide: getModelToken(Order.name),
          useValue: orderModelMock,
        },
        {
          provide: getModelToken(Food.name),
          useValue: {},
        },
        {
          provide: getModelToken(User.name),
          useValue: {},
        },
        {
          provide: OrdersGateway,
          useValue: { emitOrderStatusUpdate: jest.fn(), emitStatusUpdate: jest.fn() },
        },
        {
          provide: FoodsService,
          useValue: {},
        },
        {
          provide: CouponsService,
          useValue: {},
        },
        {
          provide: TablesService,
          useValue: {
            findOne: jest.fn().mockResolvedValue({ _id: '507f1f77bcf86cd799439011', status: 'serving' }),
            update: jest.fn().mockResolvedValue({}),
            findAll: jest.fn().mockResolvedValue([]),
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

  describe('updateStatus - Payment Release', () => {
    it('should auto-release table status to empty when order is paid and no active orders remain', async () => {
      orderModelMock.countDocuments.mockResolvedValueOnce(0);

      await service.updateStatus('order123', { status: 'paid' });

      expect(tablesService.update).toHaveBeenCalledWith('507f1f77bcf86cd799439011', { status: 'empty' });
    });
  });
});
