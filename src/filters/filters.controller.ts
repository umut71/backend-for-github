import { Controller, Post, Get, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FiltersService } from './filters.service';

@ApiTags('Filters')
@Controller('api/filters')
export class FiltersController {
  constructor(private filtersService: FiltersService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Get preset filters' })
  async getPresetFilters() {
    return this.filtersService.getPresetFilters();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI filter from prompt' })
  @ApiBody({ schema: { properties: { prompt: { type: 'string' } } } })
  async generateFilter(@Body() body: { prompt: string }) {
    return this.filtersService.generateFilterFromPrompt(body.prompt);
  }
}
