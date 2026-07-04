import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { EarningsService } from './earnings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('earnings')
@Controller('earnings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class EarningsController {
  constructor(private readonly earningsService: EarningsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get earnings overview' })
  @ApiResponse({ status: 200, description: 'Returns earnings overview' })
  async getOverview(@Req() req: any) {
    return this.earningsService.getEarningsOverview(req.user.id);
  }

  @Get('history')
  @ApiOperation({ summary: 'Get earnings history' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns earnings history' })
  async getHistory(
    @Req() req: any,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.earningsService.getEarningsHistory(
      req.user.id,
      page,
      limit,
    );
  }

  @Post('payout/request')
  @ApiOperation({ summary: 'Request payout' })
  @ApiResponse({ status: 201, description: 'Payout request submitted' })
  async requestPayout(@Req() req: any) {
    return this.earningsService.requestPayout(req.user.id);
  }

  @Get('analytics')
  @ApiOperation({ summary: 'Get earnings analytics' })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['week', 'month', 'year'],
  })
  @ApiResponse({ status: 200, description: 'Returns earnings analytics' })
  async getAnalytics(
    @Req() req: any,
    @Query('period') period: 'week' | 'month' | 'year' = 'month',
  ) {
    return this.earningsService.getEarningsAnalytics(req.user.id, period);
  }
}
