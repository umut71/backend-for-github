import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { HashtagsService } from './hashtags.service';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';

@ApiTags('hashtags')
@Controller('hashtags')
export class HashtagsController {
  constructor(private readonly hashtagsService: HashtagsService) {}

  @Get('trending')
  @ApiOperation({ summary: 'Get trending hashtags' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getTrendingHashtags(@Query('limit') limit: number = 20) {
    return this.hashtagsService.getTrendingHashtags(Number(limit));
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get popular hashtags for upload suggestions' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getPopularHashtags(@Query('limit') limit: number = 10) {
    return this.hashtagsService.getPopularHashtags(Number(limit));
  }

  @Get(':tag/videos')
  @ApiOperation({ summary: 'Get videos by hashtag' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getVideosByHashtag(
    @Param('tag') tag: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.hashtagsService.getVideosByHashtag(
      tag,
      Number(page),
      Number(limit),
    );
  }
}
