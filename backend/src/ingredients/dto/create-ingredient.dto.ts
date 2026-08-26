import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsString()
  unit: string;

  @IsNumber()
  currentQuantity: number;

  @IsNumber()
  minThreshold: number;

  @IsOptional()
  @IsString()
  lastUpdatedBy?: string;
}
