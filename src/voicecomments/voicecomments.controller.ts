import { Controller, Get, Post, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { VoiceCommentsService } from './voicecomments.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';

@ApiTags('Voice Comments')
@Controller('api/voicecomments')
export class VoiceCommentsController {
  constructor(private voiceCommentsService: VoiceCommentsService) {}

  @Post(':videoId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create voice comment' })
  @ApiBody({ schema: { properties: { audioUrl: { type: 'string' }, duration: { type: 'number' } } } })
  async create(
    @Param('videoId') videoId: string,
    @CurrentUser() user: any,
    @Body() body: { audioUrl: string; duration: number }
  ) {
    return this.voiceCommentsService.create(videoId, user.id, body.audioUrl, body.duration);
  }

  @Get(':videoId')
  @ApiOperation({ summary: 'Get voice comments for video' })
  async getByVideo(@Param('videoId') videoId: string) {
    return this.voiceCommentsService.getByVideo(videoId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete voice comment' })
  async delete(@Param('id') id: string, @CurrentUser() user: any) {
    await this.voiceCommentsService.delete(id, user.id);
    return { success: true };
  }
}
