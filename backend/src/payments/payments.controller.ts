import { Controller, Get, Param, Query } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('api/v1/payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // GET /api/v1/payments?query=HD-100001&paymentMethod=momo
  @Get()
  findAll(
    @Query('query') query?: string,
    @Query('paymentMethod') paymentMethod?: string,
  ) {
    return this.paymentsService.findAll(query, paymentMethod);
  }

  // GET /api/v1/payments/code/:code
  @Get('code/:code')
  findByCode(@Param('code') code: string) {
    return this.paymentsService.findByCode(code);
  }

  // GET /api/v1/payments/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }
}
