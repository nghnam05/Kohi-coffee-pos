import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsEnum(['pending', 'confirmed', 'cooking', 'ready', 'completed', 'cancelled', 'paid'], {
    message: 'Trạng thái phải là "pending", "confirmed", "cooking", "ready", "completed", "cancelled" hoặc "paid".',
  })
  @IsNotEmpty({ message: 'Trạng thái không được để trống.' })
  status: string;
}
