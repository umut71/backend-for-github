import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { LeaderboardService } from './leaderboard.service';

@ApiTags('Leaderboard')
@Controller('api/leaderboard')
export class LeaderboardController {
  constructor(private leaderboardService: LeaderboardService) {}

  @Get('creators')
  @ApiOperation({ summary: 'Get top creators' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getTopCreators(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.leaderboardService.getTopCreators(limit || 50);
  }

  @Get('videos')
  @ApiOperation({ summary: 'Get trending videos' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 50 })
  async getTrendingVideos(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.leaderboardService.getTrendingVideos(limit || 50);
  }
}
