import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service.js';
import { RegisterDto } from './dto/register.dto.js';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      const { password, ...userObject } = user.toObject(); // Loại bỏ password khỏi đối tượng trả về
      return userObject;
    } catch (error) {
      // Bắt lỗi trùng email (mã lỗi MongoDB 11000)
      if (error.code === 11000 || (error.name === 'MongoServerError' && error.message.includes('duplicate key'))) {
        throw new ConflictException('Địa chỉ email này đã được sử dụng.');
      }
      throw error;
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findOneByEmailWithPassword(loginDto.email);
    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const isPasswordValid = await bcrypt.compare(loginDto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    const payload = {
      sub: user._id,
      role: user.role,
      email: user.email,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  }
}
