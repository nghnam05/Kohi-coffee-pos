import { Controller, Post, Body } from '@nestjs/common';
import { AiChatService } from './ai-chat.service.js';

@Controller('ai-chat')
export class AiChatController {
  constructor(private readonly aiChatService: AiChatService) {}

  /** POST /api/v1/ai-chat/ask – Public */
  @Post('ask')
  ask(@Body('question') question: string) {
    if (!question?.trim()) return { answer: 'Vui lòng nhập câu hỏi!' };
    return this.aiChatService.ask(question.trim().substring(0, 500));
  }
}
