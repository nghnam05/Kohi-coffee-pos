import { IsEnum, IsOptional } from 'class-validator';

// Đối với Order, chỉ cho phép cập nhật trạng thái đơn hàng và trạng thái thanh toán
// KHÔNG cho phép thay đổi items hay totalAmount sau khi đã tạo đơn
export class UpdateOrderDto {
  @IsEnum(['pending', 'confirmed', 'cooking', 'completed', 'cancelled'], {
    message: 'Trạng thái phải là "pending", "confirmed", "cooking", "completed" hoặc "cancelled".',
  })
  @IsOptional()
  status?: string;

  @IsEnum(['unpaid', 'paid'], {
    message: 'Trạng thái thanh toán phải là "unpaid" hoặc "paid".',
  })
  @IsOptional()
  paymentStatus?: string;

  @IsEnum(['cash', 'momo', 'bank_transfer', 'bank'], {
    message: 'Phương thức thanh toán phải là "cash", "bank_transfer" hoặc "momo".',
  })
  @IsOptional()
  paymentMethod?: string;
}
