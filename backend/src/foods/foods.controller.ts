import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { FoodsService } from './foods.service.js';
import { CreateFoodDto } from './dto/create-food.dto.js';
import { UpdateFoodDto } from './dto/update-food.dto.js';

@Controller('foods')
export class FoodsController {
  constructor(private readonly foodsService: FoodsService) {}

  // POST /api/v1/foods
  @Post()
  create(@Body() createFoodDto: CreateFoodDto) {
    return this.foodsService.create(createFoodDto);
  }

  // GET /api/v1/foods
  // GET /api/v1/foods?category=pizza  (lọc theo danh mục)
  @Get()
  findAll(@Query('category') category?: string) {
    return this.foodsService.findAll(category);
  }

  // GET /api/v1/foods/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.foodsService.findOne(id);
  }

  // PATCH /api/v1/foods/:id
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateFoodDto: UpdateFoodDto) {
    return this.foodsService.update(id, updateFoodDto);
  }

  // DELETE /api/v1/foods/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.foodsService.remove(id);
  }
}
