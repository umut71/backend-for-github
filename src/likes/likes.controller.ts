import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { LikesService } from './likes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('likes')
@Controller('videos')
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post(':id/like')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Like a video' })
  @ApiResponse({ status: 201, description: 'Video liked successfully' })
  @ApiResponse({ status: 404, description: 'Video not found' })
  @ApiResponse({ status: 409, description: 'Video already liked' })
  async likeVideo(@Param('id') videoId: string, @Request() req: any) {
    return this.likesService.likeVideo(req.user.id, videoId);
  }

  @Delete(':id/unlike')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unlike a video' })
  @ApiResponse({ status: 200, description: 'Video unliked successfully' })
  @ApiResponse({ status: 404, description: 'Like not found' })
  async unlikeVideo(@Param('id') videoId: string, @Request() req: any) {
    return this.likesService.unlikeVideo(req.user.id, videoId);
  }

  @Get(':id/liked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user liked the video' })
  @ApiResponse({ status: 200, description: 'Returns like status' })
  async isVideoLiked(@Param('id') videoId: string, @Request() req: any) {
    const isLiked = await this.likesService.isVideoLiked(req.user.id, videoId);
    return { isLiked };
  }

  @Get(':id/likes')
  @ApiOperation({ summary: 'Get users who liked the video' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns list of users who liked the video' })
  async getVideoLikes(
    @Param('id') videoId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.likesService.getVideoLikes(videoId, page, limit);
  }
}
