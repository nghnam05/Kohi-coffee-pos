import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateShiftSwapDto {
  @IsEnum(['morning', 'afternoon', 'evening'], { message: 'Ca làm mong muốn không hợp lệ.' })
  @IsNotEmpty({ message: 'Vui lòng chọn ca làm muốn đổi.' })
  requestedShift: string;

  @IsString()
  @IsOptional()
  reason?: string;
}
