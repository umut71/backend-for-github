import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { FiltersService } from './filters.service';

@ApiTags('Filters')
@Controller('api/filters')
export class FiltersController {
  constructor(private readonly filtersService: FiltersService) {}

  @Get('presets')
  @ApiOperation({ summary: 'Retrieve preset filters' })
  async getPresetFilters(): Promise<any[]> {
    return this.filtersService.getPresetFilters();
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate AI filter based on the provided prompt' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        prompt: {
          type: 'string',
          description: 'The text prompt to generate a filter from',
        },
      },
    },
  })
  async generateFilter(@Body('prompt') prompt: string): Promise<any> {
    return this.filtersService.generateFilterFromPrompt(prompt);
  }
}
