import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../auth/current-user.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('analytics')
@Controller('api/analytics')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('creator')
  @ApiOperation({ summary: 'Get creator analytics overview' })
  @ApiQuery({
    name: 'days',
    required: false,
    type: Number,
    description: 'Number of days (default: 7)',
  })
  async getCreatorAnalytics(
    @CurrentUser() user: any,
    @Query('days') days: number = 7,
  ) {
    return this.analyticsService.getCreatorAnalytics(user.id, Number(days));
  }

  @Get('video/:id')
  @ApiOperation({ summary: 'Get video-specific analytics' })
  async getVideoAnalytics(@Param('id') videoId: string) {
    return this.analyticsService.getVideoAnalytics(videoId);
  }
}
