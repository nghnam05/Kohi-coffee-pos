import { PartialType } from '@nestjs/mapped-types';
import { CreateFoodDto } from './create-food.dto.js';

export class UpdateFoodDto extends PartialType(CreateFoodDto) {}
