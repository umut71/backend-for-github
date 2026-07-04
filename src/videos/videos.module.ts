import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { PrismaService } from '../prisma.service';
import { HashtagsModule } from '../hashtags/hashtags.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    HashtagsModule,
    JwtModule.register({ secret: process.env.JWT_SECRET }),
  ],
  controllers: [VideosController],
  providers: [VideosService, PrismaService],
})
export class VideosModule {}
