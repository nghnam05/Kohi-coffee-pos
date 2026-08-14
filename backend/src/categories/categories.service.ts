import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Category, CategoryDocument } from './schemas/category.schema.js';
import { CreateCategoryDto } from './dto/create-category.dto.js';
import { UpdateCategoryDto } from './dto/update-category.dto.js';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private readonly categoryModel: Model<CategoryDocument>,
  ) {}

  async create(dto: CreateCategoryDto): Promise<CategoryDocument> {
    const existing = await this.categoryModel.findOne({ name: dto.name }).exec();
    if (existing) {
      throw new ConflictException('Danh mục này đã tồn tại.');
    }
    const created = new this.categoryModel(dto);
    return created.save();
  }

  async findAll(): Promise<CategoryDocument[]> {
    let categories = await this.categoryModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).exec();
    if (categories.length === 0) {
      // Auto seed default categories if database is empty
      const defaults = [
        { name: 'Cà Phê', icon: 'local_cafe', order: 1 },
        { name: 'Trà Trái Cây', icon: 'local_bar', order: 2 },
        { name: 'Đá Xay', icon: 'icecream', order: 3 },
        { name: 'Bánh Ngọt', icon: 'bakery_dining', order: 4 },
        { name: 'Đồ Ăn Nhẹ', icon: 'restaurant', order: 5 },
      ];
      await this.categoryModel.insertMany(defaults);
      categories = await this.categoryModel.find({ isActive: true }).sort({ order: 1, createdAt: 1 }).exec();
    }
    return categories;
  }

  async findOne(id: string): Promise<CategoryDocument> {
    const category = await this.categoryModel.findById(id).exec();
    if (!category) {
      throw new NotFoundException('Không tìm thấy danh mục.');
    }
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<CategoryDocument> {
    if (dto.name) {
      const existing = await this.categoryModel.findOne({ name: dto.name, _id: { $ne: id } }).exec();
      if (existing) {
        throw new ConflictException('Tên danh mục này trùng với danh mục khác.');
      }
    }
    const updated = await this.categoryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!updated) {
      throw new NotFoundException('Không tìm thấy danh mục để cập nhật.');
    }
    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deleted = await this.categoryModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy danh mục để xóa.');
    }
    return { message: 'Đã xóa danh mục thành công.' };
  }
}
