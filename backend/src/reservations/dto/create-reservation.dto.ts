import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDateString, Min } from 'class-validator';

export class CreateReservationDto {
  @IsNotEmpty({ message: 'Vui lòng chọn bàn ăn.' })
  @IsString()
  tableId: string;

  @IsNotEmpty({ message: 'Vui lòng nhập họ tên khách hàng.' })
  @IsString()
  customerName: string;

  @IsNotEmpty({ message: 'Vui lòng nhập số điện thoại liên hệ.' })
  @IsString()
  customerPhone: string;

  @IsNotEmpty({ message: 'Vui lòng nhập số lượng khách.' })
  @IsNumber()
  @Min(1, { message: 'Số lượng khách phải từ 1 người trở lên.' })
  guestCount: number;

  @IsNotEmpty({ message: 'Vui lòng chọn thời gian đặt bàn.' })
  @IsDateString({}, { message: 'Định dạng thời gian đặt bàn không hợp lệ.' })
  reservationTime: string;

  @IsOptional()
  @IsString()
  note?: string;
}
