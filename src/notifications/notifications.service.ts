import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

export interface CreateNotificationDto {
  userid: string;
  type: string;
  relateduserid?: string;
  videoid?: string;
  commentid?: string;
}

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(data: CreateNotificationDto) {
    return this.prisma.notification.create({
      data,
      include: {
        relatedUser: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            videofileid: true,
          },
        },
      },
    });
  }

  async getUserNotifications(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userid: userId },
        include: {
          relatedUser: {
            select: {
              id: true,
              username: true,
              profilepictureid: true,
            },
          },
          video: {
            select: {
              id: true,
              title: true,
              videofileid: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where: { userid: userId } }),
      this.prisma.notification.count({
        where: { userid: userId, isread: false },
      }),
    ]);

    return {
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: {
        id: notificationId,
        userid: userId,
      },
    });

    if (!notification) {
      throw new Error('Notification not found');
    }

    return this.prisma.notification.update({
      where: { id: notificationId },
      data: { isread: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: {
        userid: userId,
        isread: false,
      },
      data: { isread: true },
    });
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userid: userId,
        isread: false,
      },
    });
  }
}
