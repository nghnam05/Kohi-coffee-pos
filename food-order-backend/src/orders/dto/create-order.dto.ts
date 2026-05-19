import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

// Sub-DTO: Đại diện cho từng món ăn trong đơn hàng
export class OrderItemDto {
  @IsMongoId({ message: 'foodId phải là một MongoDB ObjectId hợp lệ.' })
  @IsNotEmpty({ message: 'foodId không được để trống.' })
  foodId: string;

  @IsNumber({}, { message: 'Số lượng phải là một số.' })
  @Min(1, { message: 'Số lượng tối thiểu là 1.' })
  quantity: number;

  @IsString()
  @IsOptional()
  note?: string;
}

// Main DTO: Dữ liệu đầu vào để tạo một đơn hàng mới (không nhận totalAmount từ frontend để chống gian lận)
export class CreateOrderDto {
  @IsMongoId({ message: 'tableId phải là một MongoDB ObjectId hợp lệ.' })
  @IsNotEmpty({ message: 'tableId không được để trống.' })
  tableId: string;

  @IsArray({ message: 'items phải là một mảng.' })
  @ArrayMinSize(1, { message: 'Đơn hàng phải có ít nhất 1 món ăn.' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsEnum(['cash', 'momo'], { message: 'Phương thức thanh toán phải là "cash" hoặc "momo".' })
  @IsOptional()
  paymentMethod?: string;
}
