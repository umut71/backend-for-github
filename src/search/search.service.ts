import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async searchVideos(
    query: string,
    page: number = 1,
    limit: number = 20,
    sortBy: 'recent' | 'popular' | 'mostLiked' = 'recent',
  ) {
    const skip = (page - 1) * limit;

    const whereClause: any = {};

    if (query?.trim()) {
      whereClause.OR = [
        { description: { contains: query, mode: 'insensitive' } },
        { title: { contains: query, mode: 'insensitive' } },
        { user: { username: { contains: query, mode: 'insensitive' } } },
      ];
    }

    let orderBy: any = { createdat: 'desc' };
    if (sortBy === 'popular') {
      orderBy = { viewcount: 'desc' };
    } else if (sortBy === 'mostLiked') {
      orderBy = { likecount: 'desc' };
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where: whereClause,
        include: {
          user: { include: { profilePicture: true } },
          videoFile: true,
          thumbnailFile: true,
        },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.video.count({ where: whereClause }),
    ]);

    const formattedVideos = await Promise.all(
      videos.map(async (video: any) => {
        const videoUrl = await getFileUrl(
          video.videoFile.cloud_storage_path,
          video.videoFile.ispublic,
        );

        let thumbnailUrl = null;
        if (video.thumbnailFile) {
          thumbnailUrl = await getFileUrl(
            video.thumbnailFile.cloud_storage_path,
            video.thumbnailFile.ispublic,
          );
        }

        let avatarUrl = null;
        if (video.user?.profilePicture) {
          avatarUrl = await getFileUrl(
            video.user.profilePicture.cloud_storage_path,
            video.user.profilePicture.ispublic,
          );
        }

        return {
          id: video.id,
          description: video.description,
          videoUrl,
          thumbnailUrl,
          viewCount: video.viewcount,
          likeCount: video.likecount,
          commentCount: video.commentcount,
          createdAt: video.createdat,
          user: {
            id: video.user.id,
            username: video.user.username,
            avatarUrl,
          },
        };
      }),
    );

    return {
      videos: formattedVideos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async searchUsers(query: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const whereClause: any = {
      isbanned: false,
    };

    if (query?.trim()) {
      whereClause.OR = [
        { username: { contains: query, mode: 'insensitive' } },
        { bio: { contains: query, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        include: {
          profilePicture: true,
          _count: {
            select: {
              followers: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where: whereClause }),
    ]);

    const formattedUsers = await Promise.all(
      users.map(async (user: any) => {
        let avatarUrl = null;
        if (user.profilePicture) {
          avatarUrl = await getFileUrl(
            user.profilePicture.cloud_storage_path,
            user.profilePicture.ispublic,
          );
        }

        return {
          id: user.id,
          username: user.username,
          bio: user.bio,
          avatarUrl,
          followersCount: user._count.followers,
          videosCount: user._count.videos,
        };
      }),
    );

    return {
      users: formattedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getTrendingVideos(limit: number = 10, timeRange: '24h' | '7d' = '24h') {
    const cutoffDate = new Date();
    if (timeRange === '24h') {
      cutoffDate.setHours(cutoffDate.getHours() - 24);
    } else {
      cutoffDate.setDate(cutoffDate.getDate() - 7);
    }

    const videos = await this.prisma.video.findMany({
      where: {
        createdat: { gte: cutoffDate },
      },
      include: {
        user: { include: { profilePicture: true } },
        videoFile: true,
        thumbnailFile: true,
      },
      orderBy: { viewcount: 'desc' },
      take: limit,
    });

    const formattedVideos = await Promise.all(
      videos.map(async (video: any) => {
        const videoUrl = await getFileUrl(
          video.videoFile.cloud_storage_path,
          video.videoFile.ispublic,
        );

        let thumbnailUrl = null;
        if (video.thumbnailFile) {
          thumbnailUrl = await getFileUrl(
            video.thumbnailFile.cloud_storage_path,
            video.thumbnailFile.ispublic,
          );
        }

        let avatarUrl = null;
        if (video.user?.profilePicture) {
          avatarUrl = await getFileUrl(
            video.user.profilePicture.cloud_storage_path,
            video.user.profilePicture.ispublic,
          );
        }

        return {
          id: video.id,
          description: video.description,
          videoUrl,
          thumbnailUrl,
          viewCount: video.viewcount,
          likeCount: video.likecount,
          commentCount: video.commentcount,
          createdAt: video.createdat,
          user: {
            id: video.user.id,
            username: video.user.username,
            avatarUrl,
          },
        };
      }),
    );

    return formattedVideos;
  }

  async getTrendingHashtags(limit: number = 10) {
    const videos = await this.prisma.video.findMany({
      where: {
        description: { not: null },
      },
      select: { description: true },
    });

    const hashtagCounts = new Map<string, number>();

    videos.forEach((video) => {
      const hashtags = video.description?.match(/#\w+/g);
      if (hashtags) {
        hashtags.forEach((tag: string) => {
          const normalized = tag.toLowerCase();
          hashtagCounts.set(
            normalized,
            (hashtagCounts.get(normalized) ?? 0) + 1,
          );
        });
      }
    });

    const sortedHashtags = Array.from(hashtagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({
        tag,
        count,
      }));

    return sortedHashtags;
  }
}
