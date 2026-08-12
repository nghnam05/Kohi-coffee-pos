import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Food, FoodDocument } from './schemas/food.schema.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';

@Injectable()
export class FoodsService {
  constructor(
    @InjectModel(Food.name) private readonly foodModel: Model<FoodDocument>,
  ) {}

  async create(createFoodDto: CreateFoodDto): Promise<FoodDocument> {
    const foodData = {
      ...createFoodDto,
      image: createFoodDto.image || 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=500&auto=format&fit=crop&q=80',
    };
    const newFood = new this.foodModel(foodData);
    return newFood.save();
  }

  async findAll(category?: string): Promise<FoodDocument[]> {
    // Nếu có query param category thì lọc theo category, ngược lại trả về tất cả
    const filter = category ? { category, isAvailable: true } : {};
    return this.foodModel.find(filter).exec();
  }

  async findOne(id: string): Promise<FoodDocument> {
    const food = await this.foodModel.findById(id).exec();
    if (!food) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    return food;
  }

  async update(id: string, updateFoodDto: UpdateFoodDto): Promise<FoodDocument> {
    const updatedFood = await this.foodModel
      .findByIdAndUpdate(id, updateFoodDto, { new: true })
      .exec();

    if (!updatedFood) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    return updatedFood;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedFood = await this.foodModel.findByIdAndDelete(id).exec();
    if (!deletedFood) {
      throw new NotFoundException(`Không tìm thấy món / thức uống với ID: ${id}`);
    }
    return { message: `Đã xóa món / thức uống "${deletedFood.name}" thành công.` };
  }
}
