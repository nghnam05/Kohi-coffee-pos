import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  const mockUser = {
    _id: 'user123',
    name: 'Quản Lý Quán',
    email: 'admin@kohi.vn',
    password: '$2b$10$hashedpassword',
    role: 'admin',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersService,
          useValue: {
            create: jest.fn().mockResolvedValue({
              toObject: jest.fn().mockReturnValue(mockUser),
            }),
            findOneByEmailWithPassword: jest.fn().mockImplementation((email: string) =>
              email === 'admin@kohi.vn' ? mockUser : null,
            ),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockReturnValue('mock_jwt_token_xyz'),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    it('should throw UnauthorizedException if email does not exist', async () => {
      await expect(
        service.login({ email: 'notfound@kohi.vn', password: 'password123' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password does not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);

      await expect(
        service.login({ email: 'admin@kohi.vn', password: 'wrongpassword' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should return access_token and user info when credentials are valid', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(true);

      const result = await service.login({ email: 'admin@kohi.vn', password: 'password123' });

      expect(result).toHaveProperty('access_token');
      expect(result.access_token).toBe('mock_jwt_token_xyz');
      expect(result.user.email).toBe('admin@kohi.vn');
      expect(result.user.role).toBe('admin');
    });
  });
});
