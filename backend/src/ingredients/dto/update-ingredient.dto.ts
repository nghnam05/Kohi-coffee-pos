import { IsString, IsNumber, IsOptional } from 'class-validator';

export class UpdateIngredientDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  currentQuantity?: number;

  @IsOptional()
  @IsNumber()
  unitPrice?: number;

  @IsOptional()
  @IsNumber()
  minThreshold?: number;

  @IsOptional()
  @IsString()
  status?: 'in_stock' | 'low_stock' | 'out_of_stock';

  @IsOptional()
  @IsString()
  lastUpdatedBy?: string;

  @IsOptional()
  @IsNumber()
  quantityChange?: number;
}
