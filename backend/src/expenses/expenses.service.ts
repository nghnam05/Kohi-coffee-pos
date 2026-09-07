import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Expense, ExpenseDocument } from './schemas/expense.schema.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';

@Injectable()
export class ExpensesService {
  constructor(
    @InjectModel(Expense.name) private readonly expenseModel: Model<ExpenseDocument>,
  ) {}

  async create(dto: CreateExpenseDto): Promise<Expense> {
    const expenseDate = dto.date ? new Date(dto.date) : new Date();
    const created = new this.expenseModel({
      ...dto,
      date: expenseDate,
    });
    return created.save();
  }

  async findAll(date?: string, from?: string, to?: string): Promise<Expense[]> {
    const filter: any = {};

    if (date) {
      const [year, month, day] = date.split('-').map(Number);
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);
      filter.date = { $gte: start, $lte: end };
    } else if (from || to) {
      filter.date = {};
      if (from) {
        const [fy, fm, fd] = from.split('-').map(Number);
        filter.date.$gte = new Date(fy, fm - 1, fd, 0, 0, 0, 0);
      }
      if (to) {
        const [ty, tm, td] = to.split('-').map(Number);
        filter.date.$lte = new Date(ty, tm - 1, td, 23, 59, 59, 999);
      }
    }

    return this.expenseModel.find(filter).sort({ date: -1, createdAt: -1 }).exec();
  }

  async remove(id: string): Promise<{ success: boolean; message: string }> {
    const deleted = await this.expenseModel.findByIdAndDelete(id).exec();
    if (!deleted) {
      throw new NotFoundException('Không tìm thấy khoản chi phát sinh cần xóa');
    }
    return { success: true, message: 'Đã xóa khoản chi thành công' };
  }

  async sumExpenses(from: Date, to: Date): Promise<number> {
    const result = await this.expenseModel.aggregate([
      {
        $match: {
          date: { $gte: from, $lte: to },
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' },
        },
      },
    ]);
    return result[0]?.total ?? 0;
  }

  async findByDateRange(from: Date, to: Date): Promise<Expense[]> {
    return this.expenseModel.find({
      date: { $gte: from, $lte: to },
    }).sort({ date: -1, createdAt: -1 }).exec();
  }
}
