import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { PaymentsService } from '../../src/payments/payments.service';
import { Payment } from '../../src/payments/schemas/payment.schema';
import { Order } from '../../src/orders/schemas/order.schema';
import { NotFoundException } from '@nestjs/common';

describe('PaymentsService', () => {
  let service: PaymentsService;
  let paymentModelMock: any;
  let orderModelMock: any;

  const mockPayment = {
    _id: 'payment123',
    invoiceCode: 'HD-892147',
    orderId: 'order123',
    tableName: 'Bàn số 1',
    customerName: 'Nguyễn Văn A',
    items: [
      { foodName: 'Cà phê sữa đá', price: 35000, quantity: 2, total: 70000 },
    ],
    subtotal: 70000,
    discountAmount: 10000,
    couponCode: 'KOHI10',
    totalAmount: 60000,
    paymentMethod: 'momo',
    transactionCode: 'MM-88491023',
    paidAt: new Date(),
  };

  beforeEach(async () => {
    paymentModelMock = {
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockPayment]),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockPayment),
      }),
      countDocuments: jest.fn().mockResolvedValue(1),
    };

    function MockPaymentModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'payment123', ...dto });
    }
    MockPaymentModel.find = (...args: any[]) => paymentModelMock.find(...args);
    MockPaymentModel.findOne = (...args: any[]) => paymentModelMock.findOne(...args);
    MockPaymentModel.findById = (...args: any[]) => paymentModelMock.findById(...args);
    MockPaymentModel.countDocuments = (...args: any[]) => paymentModelMock.countDocuments(...args);

    orderModelMock = {
      find: jest.fn().mockReturnValue({
        populate: jest.fn().mockReturnValue({
          populate: jest.fn().mockReturnValue({
            exec: jest.fn().mockResolvedValue([]),
          }),
        }),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PaymentsService,
        { provide: getModelToken(Payment.name), useValue: MockPaymentModel },
        { provide: getModelToken(Order.name), useValue: orderModelMock },
      ],
    }).compile();

    service = module.get<PaymentsService>(PaymentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateInvoiceCode', () => {
    it('should generate a code starting with HD-', async () => {
      paymentModelMock.findOne.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      const code = await service.generateInvoiceCode();
      expect(code).toMatch(/^HD-\d{6}$/);
    });
  });

  describe('createFromOrder', () => {
    it('should return existing payment if already created for orderId', async () => {
      paymentModelMock.findOne.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(mockPayment) });
      const result = await service.createFromOrder({ _id: 'order123' });
      expect(result.invoiceCode).toBe('HD-892147');
    });

    it('should create new payment record for order', async () => {
      paymentModelMock.findOne.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      const fakeOrder = {
        _id: 'order999',
        tableId: { tableName: 'Bàn số 2' },
        customerName: 'Trần Văn B',
        items: [{ foodId: { name: 'Trà đào' }, price: 40000, quantity: 1 }],
        discountAmount: 0,
        totalAmount: 40000,
        paymentMethod: 'cash',
      };
      const result = await service.createFromOrder(fakeOrder);
      expect(result).toBeDefined();
      expect(result.tableName).toBe('Bàn số 2');
    });
  });

  describe('findAll', () => {
    it('should return payments filtered by query or method', async () => {
      const results = await service.findAll('HD-892147', 'momo');
      expect(results).toHaveLength(1);
      expect(results[0].invoiceCode).toBe('HD-892147');
    });
  });

  describe('findByCode', () => {
    it('should return payment when invoice code exists', async () => {
      const result = await service.findByCode('HD-892147');
      expect(result.invoiceCode).toBe('HD-892147');
    });

    it('should throw NotFoundException if invoice code does not exist', async () => {
      paymentModelMock.findOne.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findByCode('HD-000000')).rejects.toThrow(NotFoundException);
    });
  });
});
