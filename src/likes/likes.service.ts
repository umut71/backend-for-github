import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class LikesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async likeVideo(userId: string, videoId: string) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { user: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Check if already liked
    const existingLike = await this.prisma.like.findUnique({
      where: {
        userid_videoid: {
          userid: userId,
          videoid: videoId,
        },
      },
    });

    if (existingLike) {
      throw new ConflictException('Video already liked');
    }

    // Create like and update video like count
    const [like] = await this.prisma.$transaction([
      this.prisma.like.create({
        data: {
          userid: userId,
          videoid: videoId,
        },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilepictureid: true,
            },
          },
        },
      }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likecount: { increment: 1 } },
      }),
    ]);

    // Create notification (if not liking own video)
    if (video.userid !== userId) {
      await this.notificationsService.createNotification({
        userid: video.userid,
        type: 'like',
        relateduserid: userId,
        videoid: videoId,
      });
    }

    return like;
  }

  async unlikeVideo(userId: string, videoId: string) {
    const like = await this.prisma.like.findUnique({
      where: {
        userid_videoid: {
          userid: userId,
          videoid: videoId,
        },
      },
    });

    if (!like) {
      throw new NotFoundException('Like not found');
    }

    // Delete like and update video like count
    await this.prisma.$transaction([
      this.prisma.like.delete({
        where: { id: like.id },
      }),
      this.prisma.video.update({
        where: { id: videoId },
        data: { likecount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Video unliked successfully' };
  }

  async isVideoLiked(userId: string, videoId: string): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        userid_videoid: {
          userid: userId,
          videoid: videoId,
        },
      },
    });

    return !!like;
  }

  async getVideoLikes(videoId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { videoid: videoId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              profilepictureid: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where: { videoid: videoId } }),
    ]);

    return {
      likes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
