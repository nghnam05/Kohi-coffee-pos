import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Ingredient, IngredientDocument } from './schemas/ingredient.schema.js';
import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';
import { OrdersGateway } from '../orders/orders.gateway.js';

@Injectable()
export class IngredientsService {
  constructor(
    @InjectModel(Ingredient.name) private ingredientModel: Model<IngredientDocument>,
    private ordersGateway: OrdersGateway,
  ) {}

  async findAll(): Promise<Ingredient[]> {
    let items = await this.ingredientModel.find().sort({ updatedAt: -1 }).exec();
    if (items.length === 0) {
      const defaultIngredients = [
        { name: 'Hạt Cà Phê Robusta', category: 'Cà phê & Đồ uống', unit: 'kg', currentQuantity: 15, unitPrice: 180000, minThreshold: 3, status: 'in_stock', lastUpdatedBy: 'Hệ thống' },
        { name: 'Sữa Tươi Thanh Trùng', category: 'Sữa & Kem', unit: 'lít', currentQuantity: 1.5, unitPrice: 35000, minThreshold: 5, status: 'low_stock', lastUpdatedBy: 'Nguyễn Văn Barista' },
        { name: 'Đường Nước Tinh Luyện', category: 'Gia vị & Đường', unit: 'lít', currentQuantity: 0.8, unitPrice: 20000, minThreshold: 2, status: 'low_stock', lastUpdatedBy: 'Trần Thị Pha Chế' },
        { name: 'Siro Vanilla Pháp', category: 'Gia vị & Đường', unit: 'chai', currentQuantity: 0, unitPrice: 150000, minThreshold: 1, status: 'out_of_stock', lastUpdatedBy: 'Hệ thống' },
        { name: 'Bột Matcha Uji Nhật', category: 'Trà & Bột', unit: 'kg', currentQuantity: 4.5, unitPrice: 450000, minThreshold: 1, status: 'in_stock', lastUpdatedBy: 'Hệ thống' },
        { name: 'Kem Béo Rich', category: 'Sữa & Kem', unit: 'hộp', currentQuantity: 8, unitPrice: 28000, minThreshold: 2, status: 'in_stock', lastUpdatedBy: 'Hệ thống' },
      ];
      await this.ingredientModel.insertMany(defaultIngredients);
      items = await this.ingredientModel.find().sort({ updatedAt: -1 }).exec();
    }
    return items;
  }

  async findOne(id: string): Promise<Ingredient> {
    const item = await this.ingredientModel.findById(id).exec();
    if (!item) {
      throw new NotFoundException('Không tìm thấy nguyên liệu trong kho!');
    }
    return item;
  }

  async create(dto: CreateIngredientDto): Promise<Ingredient> {
    let status = 'in_stock';
    if (dto.currentQuantity === 0) {
      status = 'out_of_stock';
    } else if (dto.currentQuantity <= dto.minThreshold) {
      status = 'low_stock';
    }

    const created = new this.ingredientModel({
      ...dto,
      unitPrice: dto.unitPrice || 0,
      status,
      lastUpdatedBy: dto.lastUpdatedBy || 'Quản trị viên',
    });
    const saved = await created.save();

    if (status !== 'in_stock') {
      this.ordersGateway.emitLowStockAlert(saved);
    }
    this.ordersGateway.emitIngredientUpdated(saved);

    return saved;
  }

  async update(id: string, dto: UpdateIngredientDto): Promise<Ingredient> {
    const existing = await this.ingredientModel.findById(id).exec();
    if (!existing) {
      throw new NotFoundException('Không tìm thấy nguyên liệu trong kho!');
    }

    let newQuantity = existing.currentQuantity;
    if (typeof dto.quantityChange === 'number') {
      newQuantity = Math.max(0, existing.currentQuantity + dto.quantityChange);
    } else if (typeof dto.currentQuantity === 'number') {
      newQuantity = Math.max(0, dto.currentQuantity);
    }

    const minThreshold = typeof dto.minThreshold === 'number' ? dto.minThreshold : existing.minThreshold;

    let status = dto.status || existing.status;
    if (!dto.status || typeof dto.quantityChange === 'number' || typeof dto.currentQuantity === 'number') {
      if (newQuantity === 0) {
        status = 'out_of_stock';
      } else if (newQuantity <= minThreshold) {
        status = 'low_stock';
      } else {
        status = 'in_stock';
      }
    }

    existing.name = dto.name !== undefined ? dto.name : existing.name;
    existing.category = dto.category !== undefined ? dto.category : existing.category;
    existing.unit = dto.unit !== undefined ? dto.unit : existing.unit;
    existing.currentQuantity = newQuantity;
    existing.unitPrice = dto.unitPrice !== undefined ? dto.unitPrice : existing.unitPrice;
    existing.minThreshold = minThreshold;
    existing.status = status;
    existing.lastUpdatedBy = dto.lastUpdatedBy || 'Nhân viên';

    const updated = await existing.save();

    if (status !== 'in_stock') {
      this.ordersGateway.emitLowStockAlert(updated);
    }
    this.ordersGateway.emitIngredientUpdated(updated);

    return updated;
  }

  async remove(id: string): Promise<{ message: string }> {
    const res = await this.ingredientModel.findByIdAndDelete(id).exec();
    if (!res) {
      throw new NotFoundException('Không tìm thấy nguyên liệu để xóa!');
    }
    return { message: 'Đã xóa nguyên liệu khỏi kho thành công!' };
  }
}
