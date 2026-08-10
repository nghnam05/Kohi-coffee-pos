import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

@Controller()
export class AppController {
  constructor(@InjectConnection() private readonly connection: Connection) {}

  @Get()
  getRoot() {
    return { message: 'API is running' };
  }

  // Health‑check endpoint for MongoDB connection
  @Get('db')
  async checkDb() {
    // Ensure the mongoose connection and its underlying db are available
    if (!this.connection || !this.connection.db) {
      return { status: 'error', message: 'No DB connection' };
    }
    try {
      await this.connection.db.admin().ping();
      return { status: 'ok' };
    } catch (error) {
      return { status: 'error', message: (error as Error).message };
    }
  }
}
