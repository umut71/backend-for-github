import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_FILTER } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Core Modules
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';

// Feature Modules
import { VideosModule } from './videos/videos.module';
import { SoundsModule } from './sounds/sounds.module';
import { ChallengesModule } from './challenges/challenges.module';
import { HistoryModule } from './history/history.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PlaylistsModule } from './playlists/playlists.module';

// Support Modules
import { ModerationModule } from './moderation/moderation.module';
import { BlockingModule } from './blocking/blocking.module';
import { ShareModule } from './share/share.module';
import { ReferralsModule } from './referrals/referrals.module';
import { VoiceCommentsModule } from './voicecomments/voicecomments.module';
import { StoryPollsModule } from './storypolls/storypolls.module';

// Analytics and Reporting
import { EarningsModule } from './earnings/earnings.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HashtagsModule } from './hashtags/hashtags.module';

// Social Features
import { MessagesModule } from './messages/messages.module';
import { StoriesModule } from './stories/stories.module';
import { LivestreamModule } from './livestream/livestream.module';

// Admin and Premium
import { AdminModule } from './admin/admin.module';
import { GiftsModule } from './gifts/gifts.module';
import { PremiumModule } from './premium/premium.module';

// Health and Miscellaneous
import { PrismaModule } from './prisma/prisma.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { HealthController } from './health.controller';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 10, // 10 requests per second
      },
      {
        name: 'medium',
        ttl: 60000, // 1 minute
        limit: 60, // 60 requests per minute
      },
      {
        name: 'long',
        ttl: 900000, // 15 minutes
        limit: 100, // 100 requests per 15 minutes
      },
    ]),
    PrismaModule,

    AuthModule,
    UsersModule,
    UploadModule,

    VideosModule,
    SoundsModule,
    ChallengesModule,

    HistoryModule,
    LeaderboardModule,
    PlaylistsModule,

    ModerationModule,
    BlockingModule,
    ShareModule,
    ReferralsModule,
    VoiceCommentsModule,
    StoryPollsModule,

    EarningsModule,
    ReportsModule,
    SearchModule,
    AnalyticsModule,
    HashtagsModule,

    MessagesModule,
    StoriesModule,
    LivestreamModule,

    AdminModule,
    GiftsModule,
    PremiumModule,
  ],
  controllers: [HealthController, AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
