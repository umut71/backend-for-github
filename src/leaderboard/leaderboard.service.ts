import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class LeaderboardService {
  constructor(private prisma: PrismaService) {}

  async getTopCreators(limit: number = 50) {
    const users = await this.prisma.user.findMany({
      include: {
        profilePicture: true,
        videos: { select: { viewcount: true } },
        followers: { select: { id: true } },
      },
      orderBy: { coinbalance: 'desc' },
      take: limit,
    });

    return Promise.all(
      users.map(async (user, index) => {
        const profilePictureUrl = user.profilePicture
          ? await getFileUrl(
              user.profilePicture.cloud_storage_path,
              user.profilePicture.ispublic,
            )
          : null;

        const totalViews =
          user.videos?.reduce?.((sum, v) => sum + (v.viewcount ?? 0), 0) ?? 0;

        return {
          rank: index + 1,
          id: user.id,
          username: user.username,
          profilePictureUrl,
          coins: user.coinbalance,
          followers: user.followers?.length ?? 0,
          totalViews,
        };
      }),
    );
  }

  async getTrendingVideos(limit: number = 50) {
    const videos = await this.prisma.video.findMany({
      include: {
        user: { include: { profilePicture: true } },
        videoFile: true,
        thumbnailFile: true,
      },
      orderBy: [{ viewcount: 'desc' }, { likecount: 'desc' }],
      take: limit,
    });

    return Promise.all(
      videos.map(async (video, index) => {
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

        return {
          rank: index + 1,
          id: video.id,
          title: video.title,
          videoUrl,
          thumbnailUrl,
          viewCount: video.viewcount,
          likeCount: video.likecount,
          user: {
            id: video.user.id,
            username: video.user.username,
            profilePictureUrl,
          },
        };
      }),
    );
  }
}
