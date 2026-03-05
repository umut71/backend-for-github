import { Controller, Get, Query, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { SoundsService } from './sounds.service';

@ApiTags('Sounds')
@Controller('api/sounds')
export class SoundsController {
  constructor(private soundsService: SoundsService) {}

  @Get('search')
  @ApiOperation({ summary: 'Search sounds from Jamendo' })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async searchSounds(
    @Query('q') query: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.soundsService.searchSounds(query, limit || 20);
  }

  @Get('popular')
  @ApiOperation({ summary: 'Get popular sounds from Jamendo' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getPopularSounds(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.soundsService.getPopularSounds(limit || 20);
  }

  @Get('trending')
  @ApiOperation({ summary: 'Get trending sounds (most used in app)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  async getTrendingSounds(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ) {
    return this.soundsService.getTrendingSounds(limit || 20);
  }
}
