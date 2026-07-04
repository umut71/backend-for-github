import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class HistoryService {
  constructor(private prisma: PrismaService) {}

  async addToHistory(userId: string, videoId: string): Promise<void> {
    await this.prisma.watchhistory.upsert({
      where: { userid_videoid: { userid: userId, videoid: videoId } },
      create: { userid: userId, videoid: videoId, watchedat: new Date() },
      update: { watchedat: new Date() },
    });
  }

  async getHistory(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<
    {
      watchedAt: Date;
      video: {
        id: string;
        title: string;
        description: string;
        videoUrl: string;
        thumbnailUrl: string | null;
        viewCount: number;
        likeCount: number;
        user: {
          id: string;
          username: string;
          profilePictureUrl: string | null;
        };
      };
    }[]
  > {
    const history = await this.prisma.watchhistory.findMany({
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
      orderBy: { watchedat: 'desc' },
      take: limit,
      skip: offset,
    });

    const enrichedHistory = await Promise.all(
      history.map(async (h) => {
        const videoUrl = await getFileUrl(
          h.video.videoFile.cloud_storage_path,
          h.video.videoFile.ispublic,
        );
        const thumbnailUrl = h.video.thumbnailFile
          ? await getFileUrl(
              h.video.thumbnailFile.cloud_storage_path,
              h.video.thumbnailFile.ispublic,
            )
          : null;
        const profilePictureUrl = h.video.user.profilePicture
          ? await getFileUrl(
              h.video.user.profilePicture.cloud_storage_path,
              h.video.user.profilePicture.ispublic,
            )
          : null;

        return {
          watchedAt: h.watchedat,
          video: {
            id: h.video.id,
            title: h.video.title,
            description: h.video.description,
            videoUrl,
            thumbnailUrl,
            viewCount: h.video.viewcount,
            likeCount: h.video.likecount,
            user: {
              id: h.video.user.id,
              username: h.video.user.username,
              profilePictureUrl,
            },
          },
        };
      }),
    );

    return enrichedHistory;
  }

  async clearHistory(userId: string): Promise<void> {
    await this.prisma.watchhistory.deleteMany({ where: { userid: userId } });
  }
}
