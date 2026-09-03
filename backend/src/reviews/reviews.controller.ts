import {
  Controller, Post, Get, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReviewsService } from './reviews.service.js';
import { CreateReviewDto } from './dto/create-review.dto.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  /** POST /api/v1/reviews – Public (khách đánh giá sau khi trả tiền) */
  @Post()
  create(@Body() dto: CreateReviewDto) {
    return this.reviewsService.create(dto);
  }

  /** GET /api/v1/reviews – Admin/Staff xem tất cả */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin', 'waiter', 'barista', 'staff')
  @Get()
  findAll() {
    return this.reviewsService.findAll();
  }

  /** GET /api/v1/reviews/ai-insights – Admin xem AI phân tích đánh giá & đề xuất giải pháp */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Get('ai-insights')
  getAiReviewInsights() {
    return this.reviewsService.getAiReviewInsights();
  }

  /** GET /api/v1/reviews/food/:foodId – Public (hiện review trong modal món) */
  @Get('food/:foodId')
  findByFood(@Param('foodId') foodId: string) {
    return this.reviewsService.findByFood(foodId);
  }

  /** GET /api/v1/reviews/food/:foodId/summary – Public (avg sao + tổng lượt) */
  @Get('food/:foodId/summary')
  getRatingSummary(@Param('foodId') foodId: string) {
    return this.reviewsService.getRatingSummary(foodId);
  }

  /** GET /api/v1/reviews/order/:orderId – Public (kiểm tra đã review chưa) */
  @Get('order/:orderId')
  findByOrder(@Param('orderId') orderId: string) {
    return this.reviewsService.findByOrder(orderId);
  }

  /** DELETE /api/v1/reviews/:id – Chỉ Admin */
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @Roles('admin')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.reviewsService.remove(id);
  }
}
