import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchService } from './search.service';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';

@ApiTags('search')
@Controller('search')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get('videos')
  @ApiOperation({ summary: 'Search videos by caption or username' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['recent', 'popular', 'mostLiked'],
  })
  async searchVideos(
    @Query('q') query: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
    @Query('sortBy') sortBy: 'recent' | 'popular' | 'mostLiked' = 'recent',
  ) {
    return this.searchService.searchVideos(
      query,
      Number(page),
      Number(limit),
      sortBy,
    );
  }

  @Get('users')
  @ApiOperation({ summary: 'Search users by username or bio' })
  @ApiQuery({ name: 'q', required: false, description: 'Search query' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async searchUsers(
    @Query('q') query: string = '',
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.searchService.searchUsers(query, Number(page), Number(limit));
  }

  @Get('trending/videos')
  @ApiOperation({ summary: 'Get trending videos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'timeRange', required: false, enum: ['24h', '7d'] })
  async getTrendingVideos(
    @Query('limit') limit: number = 10,
    @Query('timeRange') timeRange: '24h' | '7d' = '24h',
  ) {
    return this.searchService.getTrendingVideos(Number(limit), timeRange);
  }

  @Get('trending/hashtags')
  @ApiOperation({ summary: 'Get trending hashtags' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingHashtags(@Query('limit') limit: number = 10) {
    return this.searchService.getTrendingHashtags(Number(limit));
  }
}
