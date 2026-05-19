import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateTableDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên bàn không được để trống.' })
  tableName: string;

  @IsString()
  @IsOptional()
  qrCodeUrl?: string;

  @IsEnum(['empty', 'serving', 'reserved'], { message: 'Trạng thái phải là "empty", "serving" hoặc "reserved".' })
  @IsOptional()
  status?: string;
}
