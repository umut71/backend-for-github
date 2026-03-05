import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class HashtagsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Extract hashtags from text (e.g., "Check #trending #viral video!")
   * Returns array of hashtag strings without # prefix
   */
  extractHashtags(text: string): string[] {
    if (!text) return [];
    
    const hashtagRegex = /#([\w\u0590-\u05ff]+)/gi;
    const matches = text.match(hashtagRegex);
    
    if (!matches) return [];
    
    // Remove # and convert to lowercase, remove duplicates
    const hashtags = matches.map((tag) => tag.slice(1).toLowerCase());
    return [...new Set(hashtags)];
  }

  /**
   * Save hashtags for a video (creates new hashtags if needed)
   * Updates usecount for existing hashtags
   */
  async saveHashtagsForVideo(videoId: string, text: string): Promise<void> {
    const tags = this.extractHashtags(text);
    
    if (tags.length === 0) return;

    // Process each hashtag
    for (const tag of tags) {
      // Upsert hashtag (create or increment usecount)
      const hashtag = await this.prisma.hashtag.upsert({
        where: { tag },
        create: {
          tag,
          usecount: 1,
        },
        update: {
          usecount: { increment: 1 },
        },
      });

      // Link video to hashtag (ignore if already linked)
      await this.prisma.videohashtag.upsert({
        where: {
          videoid_hashtagid: {
            videoid: videoId,
            hashtagid: hashtag.id,
          },
        },
        create: {
          videoid: videoId,
          hashtagid: hashtag.id,
        },
        update: {},
      });
    }
  }

  /**
   * Remove hashtags for a video when updating
   */
  async removeHashtagsForVideo(videoId: string): Promise<void> {
    // Get current hashtags
    const videoHashtags = await this.prisma.videohashtag.findMany({
      where: { videoid: videoId },
      include: { hashtag: true },
    });

    // Delete links and decrement usecount
    for (const vh of videoHashtags) {
      await this.prisma.videohashtag.delete({
        where: {
          videoid_hashtagid: {
            videoid: videoId,
            hashtagid: vh.hashtagid,
          },
        },
      });

      await this.prisma.hashtag.update({
        where: { id: vh.hashtagid },
        data: { usecount: { decrement: 1 } },
      });
    }
  }

  /**
   * Get trending hashtags (most used)
   */
  async getTrendingHashtags(limit: number = 20): Promise<any[]> {
    const hashtags = await this.prisma.hashtag.findMany({
      where: {
        usecount: { gt: 0 },
      },
      orderBy: {
        usecount: 'desc',
      },
      take: limit,
    });

    return hashtags.map((h) => ({
      tag: h.tag,
      count: h.usecount,
    }));
  }

  /**
   * Get videos by hashtag
   */
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
        orderBy: {
          video: {
            createdat: 'desc',
          },
        },
        skip,
        take: limit,
      }),
      this.prisma.videohashtag.count({
        where: { hashtagid: hashtag.id },
      }),
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

  /**
   * Get popular hashtags for suggestions
   */
  async getPopularHashtags(limit: number = 10): Promise<string[]> {
    const hashtags = await this.prisma.hashtag.findMany({
      where: {
        usecount: { gt: 2 }, // At least 3 uses
      },
      orderBy: [
        { usecount: 'desc' },
        { updatedat: 'desc' },
      ],
      take: limit,
    });

    return hashtags.map((h) => `#${h.tag}`);
  }
}
