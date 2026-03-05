import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class SavedService {
  constructor(private prisma: PrismaService) {}

  async saveVideo(userId: string, videoId: string) {
    await this.prisma.savedvideo.create({
      data: { userid: userId, videoid: videoId },
    });
  }

  async unsaveVideo(userId: string, videoId: string) {
    await this.prisma.savedvideo.deleteMany({
      where: { userid: userId, videoid: videoId },
    });
  }

  async getSavedVideos(userId: string, limit: number = 20, offset: number = 0) {
    const saved = await this.prisma.savedvideo.findMany({
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
      orderBy: { savedat: 'desc' },
      take: limit,
      skip: offset,
    });

    return Promise.all(
      saved.map(async (s) => {
        const videoUrl = await getFileUrl(s.video.videoFile.cloud_storage_path, s.video.videoFile.ispublic);
        const thumbnailUrl = s.video.thumbnailFile ? await getFileUrl(s.video.thumbnailFile.cloud_storage_path, s.video.thumbnailFile.ispublic) : null;
        const profilePictureUrl = s.video.user.profilePicture ? await getFileUrl(s.video.user.profilePicture.cloud_storage_path, s.video.user.profilePicture.ispublic) : null;

        return {
          id: s.video.id,
          title: s.video.title,
          description: s.video.description,
          videoUrl,
          thumbnailUrl,
          viewCount: s.video.viewcount,
          likeCount: s.video.likecount,
          user: {
            id: s.video.user.id,
            username: s.video.user.username,
            profilePictureUrl,
          },
        };
      }),
    );
  }
}
