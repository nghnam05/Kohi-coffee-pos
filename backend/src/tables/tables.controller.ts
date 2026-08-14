import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Put,
  Param,
  Delete,
} from '@nestjs/common';
import { TablesService } from './tables.service.js';
import { CreateTableDto } from './dto/create-table.dto.js';
import { UpdateTableDto } from './dto/update-table.dto.js';

@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  // POST /api/v1/tables
  @Post()
  create(@Body() createTableDto: CreateTableDto) {
    return this.tablesService.create(createTableDto);
  }

  // GET /api/v1/tables
  @Get()
  findAll() {
    return this.tablesService.findAll();
  }

  // GET /api/v1/tables/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tablesService.findOne(id);
  }

  // PUT /api/v1/tables/:id
  @Put(':id')
  updatePut(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  // PATCH /api/v1/tables/:id
  @Patch(':id')
  updatePatch(@Param('id') id: string, @Body() updateTableDto: UpdateTableDto) {
    return this.tablesService.update(id, updateTableDto);
  }

  // PATCH /api/v1/tables/:id/regenerate-qr
  @Patch(':id/regenerate-qr')
  regenerateQrToken(@Param('id') id: string) {
    return this.tablesService.regenerateQrToken(id);
  }

  // POST /api/v1/tables/:id/join-session
  @Post(':id/join-session')
  joinSession(@Param('id') id: string, @Body('deviceId') deviceId?: string) {
    return this.tablesService.joinSession(id, deviceId);
  }

  // POST /api/v1/tables/:id/leave-session
  @Post(':id/leave-session')
  leaveSession(@Param('id') id: string, @Body('deviceId') deviceId?: string) {
    return this.tablesService.leaveSession(id, deviceId);
  }

  // DELETE /api/v1/tables/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tablesService.remove(id);
  }
}
