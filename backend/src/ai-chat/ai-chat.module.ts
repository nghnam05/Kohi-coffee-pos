import { Module } from '@nestjs/common';
import { AiChatController } from './ai-chat.controller.js';
import { AiChatService } from './ai-chat.service.js';
import { FoodsModule } from '../foods/foods.module.js';

@Module({
  imports: [FoodsModule],
  controllers: [AiChatController],
  providers: [AiChatService],
})
export class AiChatModule {}
