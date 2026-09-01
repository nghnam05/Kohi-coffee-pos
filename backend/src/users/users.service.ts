import { Injectable, NotFoundException, ConflictException, OnModuleInit } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from './schemas/user.schema.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async onModuleInit() {
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('123456', saltRounds);

    const defaultUsers = [
      { name: 'Quản trị viên (Admin)', email: 'admin@kohi.vn', role: 'admin', assignedShift: 'morning' },
      { name: 'Nhân viên Phục vụ', email: 'phucvu@kohi.vn', role: 'waiter', assignedShift: 'morning' },
      { name: 'Nhân viên Pha chế', email: 'phache@kohi.vn', role: 'barista', assignedShift: 'afternoon' },
    ];

    for (const u of defaultUsers) {
      const exists = await this.userModel.findOne({ email: u.email });
      if (!exists) {
        await this.userModel.create({
          ...u,
          password: defaultPassword,
        });
        console.log(`[Seed] Created default user: ${u.email} (${u.role})`);
      }
    }
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const existingUser = await this.userModel.findOne({ email: createUserDto.email });
    if (existingUser) {
      throw new ConflictException(`Email "${createUserDto.email}" đã được sử dụng.`);
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(createUserDto.password, saltRounds);

    const newUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return newUser.save();
  }

  async findAll(): Promise<UserDocument[]> {
    return this.userModel.find().exec();
  }

  async findOne(id: string): Promise<UserDocument> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return user;
  }

  async findOneByEmailWithPassword(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email }).select('+password').exec();
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDocument> {
    if (updateUserDto.password && updateUserDto.password.trim() !== '') {
      const saltRounds = 10;
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, saltRounds);
    } else {
      delete updateUserDto.password;
    }

    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!updatedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return updatedUser;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedUser = await this.userModel.findByIdAndDelete(id).exec();
    if (!deletedUser) {
      throw new NotFoundException(`Không tìm thấy người dùng với ID: ${id}`);
    }
    return { message: `Đã xóa người dùng "${deletedUser.name}" thành công.` };
  }
}
