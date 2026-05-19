import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'cooking', 'completed', 'cancelled', 'paid'], {
    message: 'Trạng thái phải là "pending", "confirmed", "cooking", "completed", "cancelled" hoặc "paid".',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống.' })
  status: string;
}
