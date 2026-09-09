import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from './schemas/food.schema.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';

@Injectable()
export class FoodsService {
  // 🚀 In-memory cache for ultra-fast menu reads (< 1ms)
  private menuCache = new Map<string, { data: any[]; expiresAt: number }>();
  private readonly CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

  constructor(
    @InjectModel(Food.name) private readonly foodModel: Model<FoodDocument>,
  ) {}

  private clearCache() {
    this.menuCache.clear();
  }

  async create(createFoodDto: CreateFoodDto): Promise<FoodDocument> {
    const foodData = {
      ...createFoodDto,
      image: createFoodDto.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80',
    };
    const newFood = new this.foodModel(foodData);
    const saved = await newFood.save();
    this.clearCache();
    return saved;
  }

  async findAll(category?: string): Promise<any[]> {
    const cacheKey = category || '__ALL__';
    const cached = this.menuCache.get(cacheKey);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.data;
    }

    // Nếu có query param category thì lọc theo category, ngược lại trả về tất cả
    const filter = category ? { category, isAvailable: true } : {};
    const foods = await this.foodModel.find(filter).lean().exec();

    this.menuCache.set(cacheKey, {
      data: foods,
      expiresAt: Date.now() + this.CACHE_TTL_MS,
    });

    return foods;
  }

  async findOne(id: string): Promise<any> {
    const food = await this.foodModel.findById(id).lean().exec();
    if (!food) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    return food;
  }

  /** 🚀 Batch lookup to eliminate N+1 queries when validating order items */
  async findManyByIds(ids: any[]): Promise<any[]> {
    if (!ids || ids.length === 0) return [];
    return this.foodModel.find({ _id: { $in: ids } }).lean().exec();
  }

  async update(id: string, updateFoodDto: UpdateFoodDto): Promise<FoodDocument> {
    const updatedFood = await this.foodModel
      .findByIdAndUpdate(id, updateFoodDto, { new: true })
      .exec();

    if (!updatedFood) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    this.clearCache();
    return updatedFood;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedFood = await this.foodModel.findByIdAndDelete(id).exec();
    if (!deletedFood) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    this.clearCache();
    return { message: `Đã xóa món / thức uống "${deletedFood.name}" thành công.` };
  }
}
