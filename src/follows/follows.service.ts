import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class FollowsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async followUser(followerId: string, followingId: string) {
    if (followerId === followingId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const userToFollow = await this.prisma.user.findUnique({
      where: { id: followingId },
    });

    if (!userToFollow) {
      throw new NotFoundException('User not found');
    }

    const existingFollow = await this.prisma.follow.findFirst({
      where: {
        followerid: followerId,
        followingid: followingId,
      },
    });

    if (existingFollow) {
      throw new ConflictException('Already following this user');
    }

    const follow = await this.prisma.follow.create({
      data: {
        followerid: followerId,
        followingid: followingId,
      },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
      },
    });

    await this.notificationsService.createNotification({
      userid: followingId,
      type: 'follow',
      relateduserid: followerId,
    });

    return follow;
  }

  async unfollowUser(followerId: string, followingId: string) {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerid: followerId,
        followingid: followingId,
      },
    });

    if (!follow) {
      throw new NotFoundException('Follow relationship not found');
    }

    await this.prisma.follow.delete({
      where: { id: follow.id },
    });

    return { message: 'Unfollowed successfully' };
  }

  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const follow = await this.prisma.follow.findFirst({
      where: {
        followerid: followerId,
        followingid: followingId,
      },
    });

    return !!follow;
  }

  async getFollowers(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingid: userId },
        include: {
          follower: {
            select: {
              id: true,
              username: true,
              bio: true,
              profilepictureid: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followingid: userId } }),
    ]);

    return {
      followers: followers.map((f) => f.follower),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerid: userId },
        include: {
          following: {
            select: {
              id: true,
              username: true,
              bio: true,
              profilepictureid: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.follow.count({ where: { followerid: userId } }),
    ]);

    return {
      following: following.map((f) => f.following),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowCounts(userId: string) {
    const [followerCount, followingCount] = await Promise.all([
      this.prisma.follow.count({ where: { followingid: userId } }),
      this.prisma.follow.count({ where: { followerid: userId } }),
    ]);

    return {
      followerCount,
      followingCount,
    };
  }
}
