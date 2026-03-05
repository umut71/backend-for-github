import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateVideoDto } from './dto/create-video.dto';
import { getFileUrl } from '../lib/s3';
import { HashtagsService } from '../hashtags/hashtags.service';

@Injectable()
export class VideosService {
  constructor(
    private prisma: PrismaService,
    private hashtagsService: HashtagsService,
  ) {}

  async createVideo(userId: string, dto: CreateVideoDto) {
    // Verify video file exists
    const videoFile = await this.prisma.file.findUnique({
      where: { id: dto.videoFileId },
    });

    if (!videoFile) {
      throw new NotFoundException('Video file not found');
    }

    // Verify thumbnail file exists if provided
    if (dto.thumbnailFileId) {
      const thumbnailFile = await this.prisma.file.findUnique({
        where: { id: dto.thumbnailFileId },
      });

      if (!thumbnailFile) {
        throw new NotFoundException('Thumbnail file not found');
      }
    }

    // Verify original video exists if duet
    if (dto.isDuet && dto.originalVideoId) {
      const originalVideo = await this.prisma.video.findUnique({
        where: { id: dto.originalVideoId },
      });

      if (!originalVideo) {
        throw new NotFoundException('Original video not found');
      }
    }

    const video = await this.prisma.video.create({
      data: {
        userid: userId,
        title: dto.title,
        description: dto.description,
        videofileid: dto.videoFileId,
        thumbnailfileid: dto.thumbnailFileId,
        duration: dto.duration,
        isduet: dto.isDuet ?? false,
        originalvideoid: dto.originalVideoId,
        soundid: dto.soundId,
      },
      include: {
        user: { include: { profilePicture: true } },
        videoFile: true,
        thumbnailFile: true,
        originalVideo: {
          include: {
            user: true,
            videoFile: true,
          },
        },
      },
    });

    // Extract and save hashtags from title and description
    const hashtagText = `${dto.title || ''} ${dto.description || ''}`;
    await this.hashtagsService.saveHashtagsForVideo(video.id, hashtagText);

    return await this.formatVideoResponse(video);
  }

  async getVideoFeed(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        skip,
        take: limit,
        orderBy: { createdat: 'desc' },
        include: {
          user: { include: { profilePicture: true } },
          videoFile: true,
          thumbnailFile: true,
        },
      }),
      this.prisma.video.count(),
    ]);

    const formattedVideos = await Promise.all(
      videos.map((video) => this.formatVideoResponse(video)),
    );

    return {
      videos: formattedVideos,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getVideoById(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        user: { include: { profilePicture: true } },
        videoFile: true,
        thumbnailFile: true,
      },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    return await this.formatVideoResponse(video);
  }

  async incrementViewCount(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    const updatedVideo = await this.prisma.video.update({
      where: { id: videoId },
      data: { viewcount: { increment: 1 } },
    });

    return { viewCount: updatedVideo.viewcount };
  }

  private async formatVideoResponse(video: any) {
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

    let profilePictureUrl = null;
    if (video.user.profilePicture) {
      profilePictureUrl = await getFileUrl(
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
      duration: video.duration,
      viewCount: video.viewcount,
      likeCount: video.likecount,
      commentCount: video.commentcount,
      createdAt: video.createdat,
      user: {
        id: video.user.id,
        username: video.user.username,
        profilePictureUrl,
      },
    };
  }

  async getDuetsForVideo(videoId: string, limit: number = 20, offset: number = 0) {
    const duets = await this.prisma.video.findMany({
      where: {
        originalvideoid: videoId,
        isduet: true,
      },
      include: {
        user: {
          include: {
            profilePicture: true,
          },
        },
        videoFile: true,
        thumbnailFile: true,
        originalVideo: {
          include: {
            user: true,
            videoFile: true,
          },
        },
      },
      orderBy: {
        createdat: 'desc',
      },
      take: limit,
      skip: offset,
    });

    return Promise.all(
      duets.map(async (video) => {
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
        const profilePictureUrl = video.user.profilePicture
          ? await getFileUrl(
              video.user.profilePicture.cloud_storage_path,
              video.user.profilePicture.ispublic,
            )
          : null;

        const originalVideoUrl = video.originalVideo
          ? await getFileUrl(
              video.originalVideo.videoFile.cloud_storage_path,
              video.originalVideo.videoFile.ispublic,
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
          isDuet: video.isduet,
          createdAt: video.createdat,
          user: {
            id: video.user.id,
            username: video.user.username,
            profilePictureUrl,
          },
          originalVideo: video.originalVideo
            ? {
                id: video.originalVideo.id,
                title: video.originalVideo.title,
                videoUrl: originalVideoUrl,
                user: {
                  id: video.originalVideo.user.id,
                  username: video.originalVideo.user.username,
                },
              }
            : null,
        };
      }),
    );
  }
}
