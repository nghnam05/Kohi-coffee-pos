import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller.js';
import { UsersModule } from './users/users.module.js';
import { FoodsModule } from './foods/foods.module.js';
import { TablesModule } from './tables/tables.module.js';
import { OrdersModule } from './orders/orders.module.js';
import { AuthModule } from './auth/auth.module.js';
import { StaffCallsModule } from './staff-calls/staff-calls.module.js';
import { ReviewsModule } from './reviews/reviews.module.js';
import { CouponsModule } from './coupons/coupons.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AttendanceModule } from './attendance/attendance.module.js';
import { SalariesModule } from './salaries/salaries.module.js';
import { AiChatModule } from './ai-chat/ai-chat.module.js';
import { ReservationsModule } from './reservations/reservations.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ShiftSwapsModule } from './shift-swaps/shift-swaps.module.js';
import { PaymentsModule } from './payments/payments.module.js';
import { IngredientsModule } from './ingredients/ingredients.module.js';

@Module({
  controllers: [AppController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    FoodsModule,
    CategoriesModule,
    TablesModule,
    OrdersModule,
    StaffCallsModule,
    ReviewsModule,
    CouponsModule,
    AnalyticsModule,
    AttendanceModule,
    SalariesModule,
    AiChatModule,
    ReservationsModule,
    ShiftSwapsModule,
    PaymentsModule,
    IngredientsModule,
  ],
})
export class AppModule {}
