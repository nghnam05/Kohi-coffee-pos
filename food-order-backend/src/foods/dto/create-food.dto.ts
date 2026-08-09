import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
} from 'class-validator';

export class CreateFoodDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên món / thức uống không được để trống.' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber({}, { message: 'Giá phải là một số.' })
  @Min(0, { message: 'Giá không được âm.' })
  @IsNotEmpty({ message: 'Giá món / thức uống không được để trống.' })
  price: number;

  @IsString()
  @IsNotEmpty({ message: 'Đường dẫn ảnh không được để trống.' })
  image: string;

  @IsString()
  @IsNotEmpty({ message: 'Danh mục không được để trống.' })
  category: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;
}
