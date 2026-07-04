import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LivestreamService } from './livestream.service';
import { CurrentUser } from '../auth/current-user.decorator';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiBody } from '@nestjs/swagger';

@ApiTags('livestream')
@Controller('api/livestream')
export class LivestreamController {
  constructor(private readonly livestreamService: LivestreamService) {}

  @Post('start')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Start a new live stream' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        thumbnailFileId: { type: 'string' },
      },
      required: ['title'],
    },
  })
  async startLivestream(
    @CurrentUser() user: any,
    @Body('title') title: string,
    @Body('thumbnailFileId') thumbnailFileId?: string,
  ) {
    return this.livestreamService.startLivestream(
      user.id,
      title,
      thumbnailFileId,
    );
  }

  @Get('me/eligibility')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check if current user can go live' })
  async getEligibility(@CurrentUser() user: any) {
    return this.livestreamService.getLivestreamEligibility(user.id);
  }

  @Get('me/active')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user active live stream' })
  async getMyActiveLivestream(@CurrentUser() user: any) {
    return this.livestreamService.getMyActiveLivestream(user.id);
  }

  @Post('end/:livestreamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'End a live stream' })
  async endLivestream(
    @CurrentUser() user: any,
    @Param('livestreamId') livestreamId: string,
  ) {
    await this.livestreamService.endLivestream(livestreamId, user.id);
    return { success: true };
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active live streams' })
  async getActiveLivestreams() {
    return this.livestreamService.getActiveLivestreams();
  }

  @Get(':livestreamId')
  @ApiOperation({ summary: 'Get live stream details' })
  async getLivestream(@Param('livestreamId') livestreamId: string) {
    return this.livestreamService.getLivestream(livestreamId);
  }

  @Get(':livestreamId/gifts')
  @ApiOperation({ summary: 'Get gifts for a livestream' })
  async getLivestreamGifts(@Param('livestreamId') livestreamId: string) {
    return this.livestreamService.getLivestreamGifts(livestreamId);
  }

  @Post('join/:livestreamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Join a live stream' })
  async joinLivestream(
    @CurrentUser() user: any,
    @Param('livestreamId') livestreamId: string,
  ) {
    await this.livestreamService.joinLivestream(livestreamId, user.id);
    return { success: true };
  }

  @Post('leave/:livestreamId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Leave a live stream' })
  async leaveLivestream(
    @CurrentUser() user: any,
    @Param('livestreamId') livestreamId: string,
  ) {
    await this.livestreamService.leaveLivestream(livestreamId, user.id);
    return { success: true };
  }

  @Get('token/:channelName')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get RTC token for Agora' })
  async getRtcToken(
    @CurrentUser() user: any,
    @Param('channelName') channelName: string,
    @Query('role') role: 'publisher' | 'audience' = 'audience',
  ) {
    return this.livestreamService.getRtcToken(channelName, user.id, role);
  }
}
