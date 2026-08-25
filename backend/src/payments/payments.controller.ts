import { Controller, Get, Param, Query, Delete, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';

@Controller('payments')
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

  // DELETE /api/v1/payments/bulk
  @Delete('bulk')
  removeBulk(@Body('ids') ids: string[]) {
    return this.paymentsService.removeBulk(ids);
  }

  // GET /api/v1/payments/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.paymentsService.findOne(id);
  }

  // DELETE /api/v1/payments/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.paymentsService.remove(id);
  }
}
