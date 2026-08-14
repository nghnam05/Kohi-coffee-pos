import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { CategoriesService } from '../../src/categories/categories.service.js';
import { CategoriesController } from '../../src/categories/categories.controller.js';
import { Category } from '../../src/categories/schemas/category.schema.js';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('CategoriesModule', () => {
  let service: CategoriesService;
  let controller: CategoriesController;
  let categoryModelMock: any;

  const mockCategory = {
    _id: 'cat123',
    name: 'Cà Phê',
    icon: 'local_cafe',
    order: 1,
    isActive: true,
  };

  beforeEach(async () => {
    categoryModelMock = {
      findOne: jest.fn(),
      find: jest.fn(),
      findById: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      findByIdAndDelete: jest.fn(),
      insertMany: jest.fn(),
    };

    const mockModelConstructor = jest.fn().mockImplementation((dto) => ({
      ...dto,
      save: jest.fn().mockResolvedValue({ _id: 'cat123', ...dto }),
    }));
    Object.assign(mockModelConstructor, categoryModelMock);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        {
          provide: getModelToken(Category.name),
          useValue: mockModelConstructor,
        },
      ],
      controllers: [CategoriesController],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
    controller = module.get<CategoriesController>(CategoriesController);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a new category', async () => {
      categoryModelMock.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      const dto = { name: 'Trà Sữa', icon: 'local_bar' };
      const res = await service.create(dto);
      expect(res.name).toBe('Trà Sữa');
    });

    it('should throw ConflictException if category name exists', async () => {
      categoryModelMock.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCategory) });

      await expect(service.create({ name: 'Cà Phê' })).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return list of categories', async () => {
      categoryModelMock.find.mockReturnValue({
        sort: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([mockCategory]),
        }),
      });

      const list = await service.findAll();
      expect(list).toEqual([mockCategory]);
    });
  });

  describe('findOne', () => {
    it('should return a category by id', async () => {
      categoryModelMock.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCategory) });

      const res = await service.findOne('cat123');
      expect(res).toEqual(mockCategory);
    });

    it('should throw NotFoundException if category not found', async () => {
      categoryModelMock.findById.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });

      await expect(service.findOne('invalid')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update category details', async () => {
      categoryModelMock.findOne.mockReturnValue({ exec: jest.fn().mockResolvedValue(null) });
      categoryModelMock.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue({ ...mockCategory, name: 'Cà Phê Special' }),
      });

      const res = await service.update('cat123', { name: 'Cà Phê Special' });
      expect(res.name).toBe('Cà Phê Special');
    });
  });

  describe('remove', () => {
    it('should delete a category', async () => {
      categoryModelMock.findByIdAndDelete.mockReturnValue({ exec: jest.fn().mockResolvedValue(mockCategory) });

      const res = await service.remove('cat123');
      expect(res.message).toContain('Đã xóa');
    });
  });
});
