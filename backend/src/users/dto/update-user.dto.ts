import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto.js';

// PartialType kế thừa toàn bộ các trường từ CreateUserDto
// nhưng biến tất cả thành optional (không bắt buộc) — chuẩn cho PATCH request
export class UpdateUserDto extends PartialType(CreateUserDto) {}
