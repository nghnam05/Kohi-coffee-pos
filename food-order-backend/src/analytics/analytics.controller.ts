import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { AnalyticsService } from './analytics.service.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';

@UseGuards(AuthGuard('jwt'), RolesGuard)
@Roles('admin')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  getSummary() { return this.analyticsService.getSummary(); }

  @Get('revenue')
  getRevenue(@Query('from') from: string, @Query('to') to: string) {
    const f = from || new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
    const t = to || new Date().toISOString().split('T')[0];
    return this.analyticsService.getRevenue(f, t);
  }

  @Get('top-foods')
  getTopFoods(@Query('limit') limit: string) {
    return this.analyticsService.getTopFoods(Number(limit) || 10);
  }

  @Get('hourly')
  getHourly(@Query('date') date: string) {
    const d = date || new Date().toISOString().split('T')[0];
    return this.analyticsService.getHourly(d);
  }
}
