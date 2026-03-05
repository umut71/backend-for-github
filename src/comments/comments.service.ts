import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateCommentDto } from './dto/create-comment.dto';

@Injectable()
export class CommentsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async createComment(userId: string, videoId: string, createCommentDto: CreateCommentDto) {
    // Check if video exists
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: { user: true },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    // Create comment and update video comment count
    const [comment] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: {
          userid: userId,
          videoid: videoId,
          text: createCommentDto.text,
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
        data: { commentcount: { increment: 1 } },
      }),
    ]);

    // Create notification (if not commenting on own video)
    if (video.userid !== userId) {
      await this.notificationsService.createNotification({
        userid: video.userid,
        type: 'comment',
        relateduserid: userId,
        videoid: videoId,
        commentid: comment.id,
      });
    }

    return comment;
  }

  async getVideoComments(videoId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
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
      this.prisma.comment.count({ where: { videoid: videoId } }),
    ]);

    return {
      comments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { video: true },
    });

    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    // Only the comment owner can delete it
    if (comment.userid !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Delete comment and update video comment count
    await this.prisma.$transaction([
      this.prisma.comment.delete({
        where: { id: commentId },
      }),
      this.prisma.video.update({
        where: { id: comment.videoid },
        data: { commentcount: { decrement: 1 } },
      }),
    ]);

    return { message: 'Comment deleted successfully' };
  }
}
