import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FoodsService } from './foods.service';
import { getModelToken } from '@nestjs/mongoose';
import { Food } from './schemas/food.schema';

describe('FoodsService', () => {
  let service: FoodsService;
  let foodModelMock: any;

  const mockFood = {
    _id: 'food123',
    name: 'Cà Phê Muối Kohi',
    description: 'Cà phê rang xay phủ kem muối',
    price: 35000,
    category: 'Cà phê',
    isAvailable: true,
    image: 'https://images.unsplash.com/photo-1509042239860-f550ce710b93',
  };

  beforeEach(async () => {
    foodModelMock = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([mockFood]),
      }),
      findById: jest.fn().mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(id === 'food123' ? mockFood : null),
      })),
      findByIdAndUpdate: jest.fn().mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(id === 'food123' ? { ...mockFood, price: 40000 } : null),
      })),
      findByIdAndDelete: jest.fn().mockImplementation((id: string) => ({
        exec: jest.fn().mockResolvedValue(id === 'food123' ? mockFood : null),
      })),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodsService,
        {
          provide: getModelToken(Food.name),
          useValue: foodModelMock,
        },
      ],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return all foods when category is not specified', async () => {
      const foods = await service.findAll();
      expect(foods).toEqual([mockFood]);
      expect(foodModelMock.find).toHaveBeenCalledWith({});
    });

    it('should filter by category when category parameter is provided', async () => {
      await service.findAll('Cà phê');
      expect(foodModelMock.find).toHaveBeenCalledWith({ category: 'Cà phê', isAvailable: true });
    });
  });

  describe('findOne', () => {
    it('should return a food document if found', async () => {
      const result = await service.findOne('food123');
      expect(result).toEqual(mockFood);
    });

    it('should throw NotFoundException if food ID is not found', async () => {
      await expect(service.findOne('invalid_id')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update food price and return updated doc', async () => {
      const updated = await service.update('food123', { price: 40000 });
      expect(updated.price).toBe(40000);
    });

    it('should throw NotFoundException when updating non-existent food ID', async () => {
      await expect(service.update('invalid_id', { price: 40000 })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should remove food and return success message', async () => {
      const result = await service.remove('food123');
      expect(result.message).toContain('Đã xóa món');
    });

    it('should throw NotFoundException when removing non-existent food ID', async () => {
      await expect(service.remove('invalid_id')).rejects.toThrow(NotFoundException);
    });
  });
});
