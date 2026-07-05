import { Controller, Get, ParseIntPipe, Query, Req } from '@nestjs/common';
import type { Request } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { FeedService } from './feed.service';

@ApiTags('Feed')
@Controller('api/feed')
export class FeedController {
  constructor(
    private feedService: FeedService,
    private jwtService: JwtService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Kişiselleştirilmiş video feed (cursor tabanlı)' })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getFeed(
    @Query('cursor') cursor?: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Req() req?: Request,
  ) {
    return this.feedService.getFeed(
      this.getOptionalUserId(req),
      cursor,
      limit || 20,
    );
  }

  private getOptionalUserId(req?: Request) {
    const authHeader = req?.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return undefined;
    try {
      const payload: any = this.jwtService.verify(authHeader.split(' ')[1], {
        secret: process.env.JWT_SECRET,
      });
      return payload.sub || payload.id;
    } catch {
      return undefined;
    }
  }
}
