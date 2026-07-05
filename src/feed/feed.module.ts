import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { FeedCacheService } from './feed-cache.service';
import { PrismaService } from '../prisma.service';

@Module({
  imports: [JwtModule.register({ secret: process.env.JWT_SECRET })],
  controllers: [FeedController],
  providers: [FeedService, FeedCacheService, PrismaService],
})
export class FeedModule {}
