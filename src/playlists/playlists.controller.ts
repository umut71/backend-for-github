import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { PlaylistsService } from './playlists.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Playlists')
@Controller('api/playlists')
export class PlaylistsController {
  constructor(private playlistsService: PlaylistsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create playlist' })
  @ApiBody({
    schema: {
      properties: {
        name: { type: 'string' },
        description: { type: 'string' },
        isPublic: { type: 'boolean' },
      },
    },
  })
  async createPlaylist(
    @CurrentUser() user: any,
    @Body() body: { name: string; description?: string; isPublic?: boolean },
  ) {
    return this.playlistsService.createPlaylist(
      user.id,
      body.name,
      body.description,
      body.isPublic,
    );
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get user playlists' })
  async getUserPlaylists(@Param('userId') userId: string) {
    return this.playlistsService.getUserPlaylists(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get playlist by ID' })
  async getPlaylistById(@Param('id') id: string) {
    return this.playlistsService.getPlaylistById(id);
  }

  @Post(':playlistId/videos/:videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add video to playlist' })
  async addVideoToPlaylist(
    @CurrentUser() user: any,
    @Param('playlistId') playlistId: string,
    @Param('videoId') videoId: string,
  ) {
    await this.playlistsService.addVideoToPlaylist(
      playlistId,
      videoId,
      user.id,
    );
    return { success: true };
  }

  @Delete(':playlistId/videos/:videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove video from playlist' })
  async removeVideoFromPlaylist(
    @CurrentUser() user: any,
    @Param('playlistId') playlistId: string,
    @Param('videoId') videoId: string,
  ) {
    await this.playlistsService.removeVideoFromPlaylist(
      playlistId,
      videoId,
      user.id,
    );
    return { success: true };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete playlist' })
  async deletePlaylist(@CurrentUser() user: any, @Param('id') id: string) {
    await this.playlistsService.deletePlaylist(id, user.id);
    return { success: true };
  }
}
