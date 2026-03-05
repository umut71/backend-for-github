import { Controller, Post, Get, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { ShareService } from './share.service';

@ApiTags('Share')
@Controller('api/share')
export class ShareController {
  constructor(private shareService: ShareService) {}

  @Post(':videoId')
  @ApiOperation({ summary: 'Track video share' })
  @ApiBody({ schema: { properties: { platform: { type: 'string', example: 'whatsapp' } } } })
  async trackShare(@Param('videoId') videoId: string, @Body() body: { platform: string }) {
    await this.shareService.trackShare(videoId, body.platform);
    return { success: true };
  }

  @Get(':videoId')
  @ApiOperation({ summary: 'Get share counts' })
  async getShareCounts(@Param('videoId') videoId: string) {
    return this.shareService.getShareCounts(videoId);
  }
}
