import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { IngredientsService } from './ingredients.service.js';
import { CreateIngredientDto } from './dto/create-ingredient.dto.js';
import { UpdateIngredientDto } from './dto/update-ingredient.dto.js';

@Controller('ingredients')
export class IngredientsController {
  constructor(private readonly ingredientsService: IngredientsService) {}

  @Get()
  findAll() {
    return this.ingredientsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ingredientsService.findOne(id);
  }

  @Post()
  create(@Body() createDto: CreateIngredientDto) {
    return this.ingredientsService.create(createDto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDto: UpdateIngredientDto) {
    return this.ingredientsService.update(id, updateDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.ingredientsService.remove(id);
  }

  @Post('apply-restock')
  applyRestock(
    @Body('items') items: Array<{ name: string; quantity: number; unitPrice?: number; unit?: string; category?: string }>,
    @Body('restockedBy') restockedBy?: string,
  ) {
    return this.ingredientsService.applyRestockSuggestion(items, restockedBy);
  }
}

