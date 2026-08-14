import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FoodsService } from '../../src/foods/foods.service';
import { getModelToken } from '@nestjs/mongoose';
import { Food } from '../../src/foods/schemas/food.schema';

describe('FoodsService', () => {
  let service: FoodsService;
  let foodModelMock: any;

  const mockFood = {
    _id: 'food001',
    name: 'Kohi Den Da',
    price: 45000,
    category: 'coffee',
    image: 'https://example.com/coffee.jpg',
    isAvailable: true,
  };

  beforeEach(async () => {
    foodModelMock = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockFood]) }),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFood) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFood) }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockFood) }),
    };

    function MockFoodModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'food001', ...dto });
    }
    Object.assign(MockFoodModel, foodModelMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FoodsService,
        { provide: getModelToken(Food.name), useValue: MockFoodModel },
      ],
    }).compile();

    service = module.get<FoodsService>(FoodsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should assign default image when no image is provided', async () => {
      const result = await service.create({ name: 'Tra Sua', price: 35000, category: 'tea', isAvailable: true });
      expect(result).toBeDefined();
      expect(result.image).toBeTruthy();
    });

    it('should use the provided image URL when given', async () => {
      const customImage = 'https://mycdn.com/trasua.jpg';
      const result = await service.create({ name: 'Tra Sua', price: 35000, category: 'tea', isAvailable: true, image: customImage });
      expect(result.image).toBeTruthy();
    });
  });

  describe('findAll', () => {
    it('should return all foods when no category filter applied', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });

    it('should filter by category and isAvailable when category param is given', async () => {
      await service.findAll('coffee');
      expect(foodModelMock.find).toHaveBeenCalledWith({ category: 'coffee', isAvailable: true });
    });

    it('should apply no filter when no category param is given', async () => {
      await service.findAll();
      expect(foodModelMock.find).toHaveBeenCalledWith({});
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if food not found', async () => {
      foodModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return food when found', async () => {
      const result = await service.findOne('food001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Kohi Den Da');
      expect(result.price).toBe(45000);
    });
  });

  describe('update', () => {
    it('should throw NotFoundException if food to update does not exist', async () => {
      foodModelMock.findByIdAndUpdate.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('nonexistent', { price: 50000 })).rejects.toThrow(NotFoundException);
    });

    it('should update and return updated food', async () => {
      const result = await service.update('food001', { price: 50000 });
      expect(result).toBeDefined();
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if food does not exist', async () => {
      foodModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return success message with food name', async () => {
      const result = await service.remove('food001');
      expect(result.message).toContain('Kohi Den Da');
    });
  });
});
