import { Controller, Get, Post, Delete, Param, Query, UseGuards, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { SavedService } from './saved.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Saved Videos')
@Controller('api/saved')
export class SavedController {
  constructor(private savedService: SavedService) {}

  @Post(':videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Save video' })
  async saveVideo(@CurrentUser() user: any, @Param('videoId') videoId: string) {
    await this.savedService.saveVideo(user.id, videoId);
    return { success: true };
  }

  @Delete(':videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Unsave video' })
  async unsaveVideo(@CurrentUser() user: any, @Param('videoId') videoId: string) {
    await this.savedService.unsaveVideo(user.id, videoId);
    return { success: true };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get saved videos' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ name: 'offset', required: false, type: Number, example: 0 })
  async getSavedVideos(
    @CurrentUser() user: any,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ) {
    return this.savedService.getSavedVideos(user.id, limit || 20, offset || 0);
  }
}
