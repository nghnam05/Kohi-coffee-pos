import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Table, TableDocument } from './schemas/table.schema.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';

@Injectable()
export class TablesService {
  constructor(
    @InjectModel(Table.name) private readonly tableModel: Model<TableDocument>,
  ) {}

  async create(createTableDto: CreateTableDto): Promise<TableDocument> {
    const numberOnly = createTableDto.tableName.replace(/\D/g, '');
    const normalizedName = numberOnly ? `Bàn số ${numberOnly}` : createTableDto.tableName.trim();

    const existingTable = await this.tableModel.findOne({
      $or: [
        { tableName: normalizedName },
        { tableName: numberOnly },
        { tableName: new RegExp(`^Bàn số ${numberOnly}$`, 'i') },
      ],
    });
    if (existingTable) {
      throw new ConflictException(
        `Bàn số ${numberOnly || createTableDto.tableName} đã tồn tại trong hệ thống.`,
      );
    }

    const newTable = new this.tableModel({
      ...createTableDto,
      tableName: normalizedName,
    });
    return newTable.save();
  }

  async findAll(): Promise<any[]> {
    return this.tableModel.find().lean().exec();
  }

  async findOne(id: string): Promise<any> {
    const table = await this.tableModel.findById(id).lean().exec();
    if (!table) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }
    return table;
  }

  async update(id: string, updateTableDto: UpdateTableDto): Promise<TableDocument> {
    let normalizedPayload: any = { ...updateTableDto };
    if (updateTableDto.tableName) {
      const numberOnly = updateTableDto.tableName.replace(/\D/g, '');
      const normalizedName = numberOnly ? `Bàn số ${numberOnly}` : updateTableDto.tableName.trim();

      const existingTable = await this.tableModel.findOne({
        _id: { $ne: id },
        $or: [
          { tableName: normalizedName },
          { tableName: numberOnly },
          { tableName: new RegExp(`^Bàn số ${numberOnly}$`, 'i') },
        ],
      });
      if (existingTable) {
        throw new ConflictException(
          `Bàn số ${numberOnly || updateTableDto.tableName} đã tồn tại trong hệ thống.`,
        );
      }
      normalizedPayload.tableName = normalizedName;
    }

    const updatedTable = await this.tableModel
      .findByIdAndUpdate(id, normalizedPayload, { new: true })
      .exec();

    if (!updatedTable) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }
    return updatedTable;
  }

  async remove(id: string): Promise<{ message: string }> {
    const deletedTable = await this.tableModel.findByIdAndDelete(id).exec();
    if (!deletedTable) {
      throw new NotFoundException(`Không tìm thấy bàn với ID: ${id}`);
    }
    return { message: `Đã xóa bàn "${deletedTable.tableName}" thành công.` };
  }
}
