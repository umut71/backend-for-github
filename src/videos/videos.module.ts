import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma.service';
import { HashtagsModule } from '../hashtags/hashtags.module';

@Module({
  imports: [HashtagsModule],
  controllers: [VideosController],
  providers: [VideosService, PrismaService],
})
export class VideosModule {}
