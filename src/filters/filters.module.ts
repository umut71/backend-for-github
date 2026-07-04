import { Module } from '@nestjs/common';
import { FiltersController } from './filters.controller';
import { FiltersService } from './filters.service';

@Module({
  imports: [],
  controllers: [FiltersController],
  providers: [FiltersService],
})
export class TikTokFiltersModule {}
