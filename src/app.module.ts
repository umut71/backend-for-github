import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { UploadModule } from './upload/upload.module';
import { VideosModule } from './videos/videos.module';
import { SoundsModule } from './sounds/sounds.module';
import { ChallengesModule } from './challenges/challenges.module';
import { HistoryModule } from './history/history.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { PlaylistsModule } from './playlists/playlists.module';
import { FiltersModule } from './filters/filters.module';
import { ModerationModule } from './moderation/moderation.module';
import { BlockingModule } from './blocking/blocking.module';
import { ShareModule } from './share/share.module';
import { ReferralsModule } from './referrals/referrals.module';
import { VoiceCommentsModule } from './voicecomments/voicecomments.module';
import { StoryPollsModule } from './storypolls/storypolls.module';
import { SavedModule } from './saved/saved.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowsModule } from './follows/follows.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { GiftsModule } from './gifts/gifts.module';
import { PremiumModule } from './premium/premium.module';
import { EarningsModule } from './earnings/earnings.module';
import { ReportsModule } from './reports/reports.module';
import { SearchModule } from './search/search.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { HashtagsModule } from './hashtags/hashtags.module';
import { MessagesModule } from './messages/messages.module';
import { StoriesModule } from './stories/stories.module';
import { LivestreamModule } from './livestream/livestream.module';
import { PrismaModule } from './prisma/prisma.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    HistoryModule,
    LeaderboardModule,
    PlaylistsModule,
    ModerationModule,
    BlockingModule,
    ShareModule,
    FiltersModule,
    SavedModule,
    ChallengesModule,
    ReferralsModule,
    VoiceCommentsModule,
    StoryPollsModule,
    SoundsModule,
    ConfigModule.forRoot({ isGlobal: true }),
    // Rate limiting: 100 requests per 15 minutes per IP
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
    LikesModule,
    CommentsModule,
    FollowsModule,
    NotificationsModule,
    AdminModule,
    GiftsModule,
    PremiumModule,
    EarningsModule,
    ReportsModule,
    SearchModule,
    AnalyticsModule,
    HashtagsModule,
    MessagesModule,
    StoriesModule,
    LivestreamModule,
  ],
  controllers: [HealthController],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
