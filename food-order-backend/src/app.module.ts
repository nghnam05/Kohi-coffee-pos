import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { UsersModule } from './users/users.module.js';
import { FoodsModule } from './foods/foods.module.js';
import { TablesModule } from './tables/tables.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';

@Module({
  controllers: [AppController],
  imports: [
    // 1. Cấu hình biến môi trường - isGlobal: true giúp dùng ConfigService ở bất kỳ module nào
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // 2. Kết nối MongoDB - đọc URI từ biến môi trường MONGODB_URI
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // 3. Các Feature Modules
    AuthModule,
    UsersModule,
    FoodsModule,
    TablesModule,
    OrdersModule,
  ],
})
export class AppModule {}
