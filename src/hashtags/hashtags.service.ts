import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HashtagsService {
  constructor(private prisma: PrismaService) {}

  extractHashtags(text: string): string[] {
    if (!text) return [];

    const hashtagRegex = /#([\w\u0590-\u05ff]+)/gi;
    const matches = text.match(hashtagRegex);

    if (!matches) return [];

    const hashtags = matches.map((tag) => tag.slice(1).toLowerCase());
    return [...new Set(hashtags)];
  }

  async saveHashtagsForVideo(videoId: string, text: string): Promise<void> {
    const tags = this.extractHashtags(text);

    if (tags.length === 0) return;

    for (const tag of tags) {
      const newHashtag = await this.prisma.hashtag.upsert({
        where: { tag },
        create: {
          tag,
          usecount: 1,
        },
        update: {
          usecount: { increment: 1 },
        },
      });

      await this.prisma.videohashtag.upsert({
        where: {
          videoid_hashtagid: {
            videoid: videoId,
            hashtagid: newHashtag.id,
          },
        },
        create: {
          videoid: videoId,
          hashtagid: newHashtag.id,
        },
        update: {},
      });
    }
  }

  async removeHashtagsForVideo(videoId: string): Promise<void> {
    const videoHashtags = await this.prisma.videohashtag.findMany({
      where: { videoid: videoId },
      include: { hashtag: true },
    });

    for (const vh of videoHashtags) {
      await this.prisma.videohashtag.delete({
        where: {
          videoid_hashtagid: {
            videoid: videoId,
            hashtagid: vh.hashtagid,
          },
        },
      });

      const hashtag = await this.prisma.hashtag.findUnique({
        where: { id: vh.hashtagid },
      });

      if (hashtag && hashtag.usecount > 0) {
        await this.prisma.hashtag.update({
          where: { id: vh.hashtagid },
          data: { usecount: { decrement: 1 } },
        });
      }
    }
  }

  async getTrendingHashtags(limit: number = 20): Promise<any[]> {
    const trendingHashtags = await this.prisma.hashtag.findMany({
      where: { usecount: { gt: 0 } },
      orderBy: { usecount: 'desc' },
      take: limit,
    });

    return trendingHashtags.map((h) => ({
      tag: h.tag,
      count: h.usecount,
    }));
  }

  async getVideosByHashtag(
    tag: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<any> {
    const hashtag = await this.prisma.hashtag.findUnique({
      where: { tag: tag.toLowerCase() },
    });

    if (!hashtag) {
      return {
        videos: [],
        total: 0,
        page,
        totalPages: 0,
      };
    }

    const skip = (page - 1) * limit;

    const [videoHashtags, total] = await Promise.all([
      this.prisma.videohashtag.findMany({
        where: { hashtagid: hashtag.id },
        include: {
          video: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  email: true,
                  profilepictureid: true,
                },
              },
              videoFile: true,
              thumbnailFile: true,
              _count: {
                select: {
                  likes: true,
                  comments: true,
                },
              },
            },
          },
        },
        orderBy: { video: { createdat: 'desc' } },
        skip,
        take: limit,
      }),
      this.prisma.videohashtag.count({ where: { hashtagid: hashtag.id } }),
    ]);

    const videos = videoHashtags.map((vh) => vh.video);

    return {
      videos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hashtag: {
        tag: hashtag.tag,
        useCount: hashtag.usecount,
      },
    };
  }

  async getPopularHashtags(limit: number = 10): Promise<string[]> {
    const popularHashtags = await this.prisma.hashtag.findMany({
      where: { usecount: { gt: 2 } },
      orderBy: [{ usecount: 'desc' }, { updatedat: 'desc' }],
      take: limit,
    });

    return popularHashtags.map((h) => `#${h.tag}`);
  }
}
