import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    // Check if username is already taken
    if (dto.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: dto.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    // Verify profilePictureId exists if provided
    if (dto.profilePictureId) {
      const file = await this.prisma.file.findUnique({
        where: { id: dto.profilePictureId },
      });

      if (!file) {
        throw new NotFoundException('Profile picture file not found');
      }
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: dto.username,
        bio: dto.bio,
        profilepictureid: dto.profilePictureId,
      },
      include: { profilePicture: true },
    });

    return await this.formatUserResponse(user);
  }

  async getUserProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        profilePicture: true,
        videos: {
          include: {
            videoFile: true,
            thumbnailFile: true,
          },
          orderBy: { createdat: 'desc' },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let profilePictureUrl = null;
    if (user.profilePicture) {
      profilePictureUrl = await getFileUrl(
        user.profilePicture.cloud_storage_path,
        user.profilePicture.ispublic,
      );
    }

    const videos = await Promise.all(
      user.videos.map(async (video) => {
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

        return {
          id: video.id,
          title: video.title,
          description: video.description,
          thumbnailUrl,
          videoUrl,
          duration: video.duration,
          viewCount: video.viewcount,
          createdAt: video.createdat,
        };
      }),
    );

    return {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profilePictureUrl,
      videos,
    };
  }

  async getLikedVideos(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [likes, total] = await Promise.all([
      this.prisma.like.findMany({
        where: { userid: userId },
        include: {
          video: {
            include: {
              user: { include: { profilePicture: true } },
              videoFile: true,
              thumbnailFile: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.like.count({ where: { userid: userId } }),
    ]);

    const videos = await Promise.all(
      likes.map(async (like: any) => {
        const video = like.video;
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
          title: video.title,
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
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async deleteAccount(userId: string) {
    // Soft delete: Mark user as deleted by adding suffix to email/username
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const timestamp = Date.now();
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        email: `deleted_${timestamp}_${user.email}`,
        username: `deleted_${timestamp}_${user.username}`,
        bio: null,
        profilepictureid: null,
        isbanned: true,
      },
    });

    return {
      success: true,
      message: 'Account deleted successfully',
    };
  }

  private async formatUserResponse(user: any) {
    let profilePictureUrl = null;
    if (user.profilePicture) {
      profilePictureUrl = await getFileUrl(
        user.profilePicture.cloud_storage_path,
        user.profilePicture.ispublic,
      );
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      bio: user.bio,
      profilePictureUrl,
    };
  }
}
