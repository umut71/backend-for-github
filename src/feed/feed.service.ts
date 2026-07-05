import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';
import { FeedCacheService } from './feed-cache.service';
import {
  loadFeedWeightsFromEnv,
  rankVideos,
  ViewerContext,
  EMPTY_VIEWER_CONTEXT,
} from './feed-scorer';

const FEED_CACHE_TTL_SEC = Number(process.env.FEED_CACHE_TTL_SEC) || 60;
const CANDIDATE_POOL_PER_SOURCE = 100;
const MAX_POOL_SIZE = 300;

interface CachedFeed {
  items: any[];
  builtAt: number;
}

function encodeCursor(offset: number): string {
  return Buffer.from(String(offset), 'utf8').toString('base64url');
}

function decodeCursor(cursor?: string): number {
  if (!cursor) return 0;
  const parsed = Number(Buffer.from(cursor, 'base64url').toString('utf8'));
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : 0;
}

/**
 * ADIM 4 — Feed MVP.
 * Retrieval: takip edilenlerin son videoları + son 24 saatin trendleri
 *            + yeni videolar (fallback) → heuristik skorla sırala.
 * Cache: kullanıcı başına sıralanmış liste (Redis varsa Redis, yoksa bellek).
 * Cursor: sıralanmış liste içinde opak offset (base64url).
 */
@Injectable()
export class FeedService {
  private readonly logger = new Logger(FeedService.name);

  constructor(
    private prisma: PrismaService,
    private cache: FeedCacheService,
  ) {}

  async getFeed(userId?: string, cursor?: string, limit: number = 20) {
    const safeLimit = Math.min(Math.max(limit || 20, 1), 50);
    const offset = decodeCursor(cursor);
    const cacheKey = `feed:v1:${userId ?? 'anon'}`;

    let feed = await this.cache.get<CachedFeed>(cacheKey);
    if (!feed) {
      feed = await this.buildFeed(userId);
      await this.cache.set(cacheKey, feed, FEED_CACHE_TTL_SEC);
    }

    const items = feed.items.slice(offset, offset + safeLimit);
    const nextOffset = offset + safeLimit;

    return {
      items,
      nextCursor: nextOffset < feed.items.length ? encodeCursor(nextOffset) : null,
      total: feed.items.length,
      cached: Date.now() - feed.builtAt > 500,
    };
  }

  private async buildFeed(userId?: string): Promise<CachedFeed> {
    const since24h = new Date(Date.now() - 24 * 36e5);
    const include = {
      user: { include: { profilePicture: true } },
      videoFile: true,
      thumbnailFile: true,
    };

    const followingIds = userId
      ? (
          await this.prisma.follow.findMany({
            where: { followerid: userId },
            select: { followingid: true },
          })
        ).map((f) => f.followingid)
      : [];

    const [followingVideos, trendingVideos, recentVideos] = await Promise.all([
      followingIds.length
        ? this.prisma.video.findMany({
            where: { userid: { in: followingIds } },
            orderBy: { createdat: 'desc' },
            take: CANDIDATE_POOL_PER_SOURCE,
            include,
          })
        : Promise.resolve([]),
      this.prisma.video.findMany({
        where: { createdat: { gte: since24h } },
        orderBy: [{ likecount: 'desc' }, { viewcount: 'desc' }],
        take: CANDIDATE_POOL_PER_SOURCE,
        include,
      }),
      this.prisma.video.findMany({
        orderBy: { createdat: 'desc' },
        take: CANDIDATE_POOL_PER_SOURCE,
        include,
      }),
    ]);

    // Kaynakları birleştir, id bazında tekilleştir, havuzu sınırla
    const poolMap = new Map<string, any>();
    for (const video of [...followingVideos, ...trendingVideos, ...recentVideos]) {
      if (!poolMap.has(video.id)) poolMap.set(video.id, video);
      if (poolMap.size >= MAX_POOL_SIZE) break;
    }
    const pool = [...poolMap.values()];

    const ctx = userId
      ? await this.getViewerContext(userId, followingIds)
      : EMPTY_VIEWER_CONTEXT;

    const weights = loadFeedWeightsFromEnv();
    const ranked = rankVideos(
      pool.map((video) => ({
        id: video.id,
        creatorId: video.userid,
        likeCount: video.likecount ?? 0,
        commentCount: video.commentcount ?? 0,
        viewCount: video.viewcount ?? 0,
        createdAt: video.createdat,
        raw: video,
      })),
      ctx,
      weights,
    );

    const items = await Promise.all(
      ranked.map((entry: any) => this.formatVideo(entry.raw)),
    );

    return { items, builtAt: Date.now() };
  }

  private async getViewerContext(
    userId: string,
    followingIds: string[],
  ): Promise<ViewerContext> {
    try {
      const history = await this.prisma.watchhistory.findMany({
        where: { userid: userId },
        take: 200,
        orderBy: { watchedat: 'desc' },
        select: { videoid: true },
      });
      return {
        followedCreatorIds: new Set(followingIds),
        seenVideoIds: new Set(history.map((h) => h.videoid)),
      };
    } catch (err) {
      this.logger.warn(`Viewer context alınamadı: ${(err as Error).message}`);
      return {
        followedCreatorIds: new Set(followingIds),
        seenVideoIds: new Set(),
      };
    }
  }

  private async formatVideo(video: any) {
    const videoUrl = await getFileUrl(
      video.videoFile.cloud_storage_path,
      video.videoFile.ispublic,
    );
    const thumbnailUrl = video.thumbnailFile
      ? await getFileUrl(
          video.thumbnailFile.cloud_storage_path,
          video.thumbnailFile.ispublic,
        )
      : null;
    const profilePictureUrl = video.user?.profilePicture
      ? await getFileUrl(
          video.user.profilePicture.cloud_storage_path,
          video.user.profilePicture.ispublic,
        )
      : null;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      videoUrl,
      thumbnailUrl,
      duration: video.duration,
      viewCount: video.viewcount,
      likeCount: video.likecount,
      commentCount: video.commentcount,
      createdAt: video.createdat,
      user: {
        id: video.user?.id,
        username: video.user?.username,
        profilePictureUrl,
      },
    };
  }
}
