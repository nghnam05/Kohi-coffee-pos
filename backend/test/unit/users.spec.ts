import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from '../../src/users/users.service';
import { getModelToken } from '@nestjs/mongoose';
import { User } from '../../src/users/schemas/user.schema';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
  compare: jest.fn(),
}));

describe('UsersService', () => {
  let service: UsersService;
  let userModelMock: any;

  const mockUser = {
    _id: 'user001',
    name: 'Nguyen Van A',
    email: 'nva@kohi.vn',
    role: 'waiter',
    assignedShift: 'morning',
    toObject: jest.fn().mockReturnValue({ _id: 'user001', name: 'Nguyen Van A', email: 'nva@kohi.vn' }),
  };

  beforeEach(async () => {
    userModelMock = {
      find: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue([mockUser]) }),
      findOne: jest.fn().mockResolvedValue(null),
      findById: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findByIdAndUpdate: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      findByIdAndDelete: jest.fn().mockReturnValue({ exec: jest.fn().mockResolvedValue(mockUser) }),
      create: jest.fn().mockResolvedValue(mockUser),
    };

    function MockUserModel(this: any, dto: any) {
      Object.assign(this, dto);
      this.save = jest.fn().mockResolvedValue({ _id: 'user001', ...dto });
    }
    MockUserModel.find = (...args: any[]) => userModelMock.find(...args);
    MockUserModel.findOne = (...args: any[]) => userModelMock.findOne(...args);
    MockUserModel.findById = (...args: any[]) => userModelMock.findById(...args);
    MockUserModel.findByIdAndUpdate = (...args: any[]) => userModelMock.findByIdAndUpdate(...args);
    MockUserModel.findByIdAndDelete = (...args: any[]) => userModelMock.findByIdAndDelete(...args);
    MockUserModel.create = (...args: any[]) => userModelMock.create(...args);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: getModelToken(User.name), useValue: MockUserModel },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should throw ConflictException if email already exists', async () => {
      userModelMock.findOne.mockResolvedValueOnce(mockUser);
      await expect(
        service.create({ name: 'Test', email: 'nva@kohi.vn', password: '123456', role: 'waiter', assignedShift: 'morning' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash password before saving', async () => {
      await service.create({ name: 'New User', email: 'new@kohi.vn', password: 'rawpass', role: 'waiter', assignedShift: 'morning' });
      expect(bcrypt.hash).toHaveBeenCalledWith('rawpass', 10);
    });

    it('should create user successfully when email is unique', async () => {
      const result = await service.create({ name: 'New User', email: 'newuser@kohi.vn', password: '123456', role: 'barista', assignedShift: 'afternoon' });
      expect(result).toBeDefined();
    });
  });

  describe('findAll', () => {
    it('should return array of users', async () => {
      const result = await service.findAll();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should throw NotFoundException if user not found', async () => {
      userModelMock.findById.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.findOne('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return the user when found', async () => {
      const result = await service.findOne('user001');
      expect(result).toBeDefined();
      expect(result.name).toBe('Nguyen Van A');
    });
  });

  describe('update', () => {
    it('should hash new password when password is provided and non-empty', async () => {
      await service.update('user001', { password: 'newpassword' });
      expect(bcrypt.hash).toHaveBeenCalledWith('newpassword', 10);
    });

    it('should NOT hash when password field is empty string', async () => {
      jest.clearAllMocks();
      await service.update('user001', { password: '' });
      expect(bcrypt.hash).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if user to update does not exist', async () => {
      userModelMock.findByIdAndUpdate.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.update('nonexistent', { name: 'Changed' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should throw NotFoundException if user does not exist', async () => {
      userModelMock.findByIdAndDelete.mockReturnValueOnce({ exec: jest.fn().mockResolvedValue(null) });
      await expect(service.remove('nonexistent')).rejects.toThrow(NotFoundException);
    });

    it('should return success message with user name', async () => {
      const result = await service.remove('user001');
      expect(result.message).toContain('Nguyen Van A');
    });
  });
});
