import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { VideosService } from './videos.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Videos')
@Controller('api/videos')
export class VideosController {
  constructor(private videosService: VideosService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create video' })
  async createVideo(
    @CurrentUser() user: any,
    @Body() dto: CreateVideoDto,
  ) {
    return this.videosService.createVideo(user.id, dto);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Get video feed' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 10 })
  async getVideoFeed(
    @Query('page', new ParseIntPipe({ optional: true })) page?: number,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.videosService.getVideoFeed(page || 1, limit || 10);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get video by ID' })
  async getVideoById(@Param('id') id: string) {
    return this.videosService.getVideoById(id);
  }

  @Put(':id/view')
  @ApiOperation({ summary: 'Increment view count' })
  async incrementViewCount(@Param('id') id: string) {
    return this.videosService.incrementViewCount(id);
  }

  @Get(':id/duets')
  @ApiOperation({ summary: 'Get duets for a video' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async getDuetsForVideo(
    @Param('id') id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.videosService.getDuetsForVideo(id, limit || 20, offset || 0);
  }
}
