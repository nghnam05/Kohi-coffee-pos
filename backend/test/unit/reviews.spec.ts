import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { ReviewsService } from '../../src/reviews/reviews.service';
import { getModelToken } from '@nestjs/mongoose';
import { Review } from '../../src/reviews/schemas/review.schema';
import { Order } from '../../src/orders/schemas/order.schema';

describe('ReviewsService', () => {
  let service: ReviewsService;
  let reviewModelMock: any;
  let orderModelMock: any;

  const mockReview = {
    _id: 'rev123',
    orderId: 'order123',
    overallStar: 5,
    overallComment: 'Cà phê tuyệt vời!',
    ratings: [],
    save: jest.fn().mockImplementation(function () {
      return Promise.resolve(this);
    }),
  };

  const mockPaidOrder = {
    _id: 'order123',
    status: 'paid',
  };

  beforeEach(async () => {
    reviewModelMock = function (dto: any) {
      return {
        ...dto,
        _id: 'rev123',
        save: jest.fn().mockResolvedValue({ ...dto, _id: 'rev123' }),
      };
    };

    reviewModelMock.countDocuments = jest.fn().mockResolvedValue(1);
    reviewModelMock.find = jest.fn().mockReturnValue({
      populate: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      lean: jest.fn().mockReturnThis(),
      exec: jest.fn().mockResolvedValue([mockReview]),
    });
    reviewModelMock.findOne = jest.fn().mockImplementation(() => ({
      lean: jest.fn().mockImplementation(() => ({
        exec: jest.fn().mockResolvedValue(null),
        then: jest.fn().mockImplementation((resolve: any) => resolve(null)),
      })),
    }));
    reviewModelMock.findByIdAndDelete = jest.fn().mockReturnValue({
      exec: jest.fn().mockResolvedValue(mockReview),
    });
    reviewModelMock.aggregate = jest.fn().mockResolvedValue([{ avgStar: 4.8, totalReviews: 10 }]);

    orderModelMock = {
      findById: jest.fn().mockReturnValue({
        lean: jest.fn().mockResolvedValue(mockPaidOrder),
      }),
      find: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReviewsService,
        { provide: getModelToken(Review.name), useValue: reviewModelMock },
        { provide: getModelToken(Order.name), useValue: orderModelMock },
      ],
    }).compile();

    service = module.get<ReviewsService>(ReviewsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create review successfully for a paid order', async () => {
      const result = await service.create({
        orderId: 'order123',
        overallStar: 5,
        overallComment: 'Tuyệt vời',
        ratings: [],
      });
      expect(result).toBeDefined();
    });

    it('should throw NotFoundException if order does not exist', async () => {
      orderModelMock.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue(null),
      });
      await expect(
        service.create({ orderId: 'nonexistent', overallStar: 5, ratings: [] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if order is not paid or completed', async () => {
      orderModelMock.findById.mockReturnValueOnce({
        lean: jest.fn().mockResolvedValue({ _id: 'order123', status: 'pending' }),
      });
      await expect(
        service.create({ orderId: 'order123', overallStar: 5, ratings: [] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if order has already been reviewed', async () => {
      reviewModelMock.findOne.mockReturnValueOnce({
        lean: jest.fn().mockImplementation(() => ({
          exec: jest.fn().mockResolvedValue(mockReview),
          then: jest.fn().mockImplementation((resolve: any) => resolve(mockReview)),
        })),
      });
      await expect(
        service.create({ orderId: 'order123', overallStar: 5, ratings: [] }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should delete review successfully', async () => {
      const result = await service.remove('rev123');
      expect(result.message).toContain('thành công');
    });

    it('should throw NotFoundException if review does not exist', async () => {
      reviewModelMock.findByIdAndDelete.mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue(null),
      });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });
  });
});
