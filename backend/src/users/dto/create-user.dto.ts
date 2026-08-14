import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên người dùng không được để trống.' })
  name: string;

  @IsEmail({}, { message: 'Địa chỉ email không hợp lệ.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống.' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  password: string;

  @IsEnum(['admin', 'waiter', 'barista', 'staff'], { message: 'Vai trò không hợp lệ.' })
  @IsOptional()
  role?: string;

  @IsEnum(['morning', 'afternoon', 'evening'], { message: 'Ca làm không hợp lệ.' })
  @IsOptional()
  assignedShift?: string;
}
