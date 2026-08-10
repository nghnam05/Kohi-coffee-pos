import { Type } from 'class-transformer';
import {
  IsArray, IsMongoId, IsNumber, IsOptional, IsString,
  Max, MaxLength, Min, ValidateNested,
} from 'class-validator';

export class FoodRatingDto {
  @IsMongoId()
  foodId: string;

  @IsNumber()
  @Min(1)
  @Max(5)
  star: number;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  comment?: string;
}

export class CreateReviewDto {
  @IsMongoId()
  orderId: string;

  @IsMongoId()
  tableId: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FoodRatingDto)
  ratings: FoodRatingDto[];

  @IsNumber()
  @Min(1)
  @Max(5)
  overallStar: number;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  overallComment?: string;
}
