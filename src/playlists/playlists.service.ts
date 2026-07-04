import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';

@Injectable()
export class PlaylistsService {
  constructor(private prisma: PrismaService) {}

  async createPlaylist(
    userId: string,
    name: string,
    description?: string,
    isPublic: boolean = true,
  ) {
    return this.prisma.playlist.create({
      data: { userid: userId, name, description, ispublic: isPublic },
    });
  }

  async getUserPlaylists(userId: string) {
    return this.prisma.playlist.findMany({
      where: { userid: userId },
      include: { videos: { include: { video: true } } },
      orderBy: { createdat: 'desc' },
    });
  }

  async getPlaylistById(playlistId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
      include: {
        user: { include: { profilePicture: true } },
        videos: {
          include: {
            video: {
              include: {
                user: { include: { profilePicture: true } },
                videoFile: true,
                thumbnailFile: true,
              },
            },
          },
        },
      },
    });

    if (!playlist) throw new NotFoundException('Playlist not found');

    const profilePictureUrl = playlist.user.profilePicture
      ? await getFileUrl(
          playlist.user.profilePicture.cloud_storage_path,
          playlist.user.profilePicture.ispublic,
        )
      : null;

    const videos = await Promise.all(
      (playlist.videos ?? []).map(async (pv) => {
        const videoUrl = await getFileUrl(
          pv.video.videoFile.cloud_storage_path,
          pv.video.videoFile.ispublic,
        );
        const thumbnailUrl = pv.video.thumbnailFile
          ? await getFileUrl(
              pv.video.thumbnailFile.cloud_storage_path,
              pv.video.thumbnailFile.ispublic,
            )
          : null;
        const userProfilePicUrl = pv.video.user.profilePicture
          ? await getFileUrl(
              pv.video.user.profilePicture.cloud_storage_path,
              pv.video.user.profilePicture.ispublic,
            )
          : null;

        return {
          id: pv.video.id,
          title: pv.video.title,
          videoUrl,
          thumbnailUrl,
          viewCount: pv.video.viewcount,
          likeCount: pv.video.likecount,
          user: {
            id: pv.video.user.id,
            username: pv.video.user.username,
            profilePictureUrl: userProfilePicUrl,
          },
        };
      }),
    );

    return {
      id: playlist.id,
      name: playlist.name,
      description: playlist.description,
      isPublic: playlist.ispublic,
      user: {
        id: playlist.user.id,
        username: playlist.user.username,
        profilePictureUrl,
      },
      videos,
    };
  }

  async addVideoToPlaylist(
    playlistId: string,
    videoId: string,
    userId: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userid !== userId) throw new NotFoundException('Unauthorized');

    await this.prisma.playlistvideo.create({
      data: { playlistid: playlistId, videoid: videoId },
    });
  }

  async removeVideoFromPlaylist(
    playlistId: string,
    videoId: string,
    userId: string,
  ) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userid !== userId) throw new NotFoundException('Unauthorized');

    await this.prisma.playlistvideo.deleteMany({
      where: { playlistid: playlistId, videoid: videoId },
    });
  }

  async deletePlaylist(playlistId: string, userId: string) {
    const playlist = await this.prisma.playlist.findUnique({
      where: { id: playlistId },
    });
    if (!playlist) throw new NotFoundException('Playlist not found');
    if (playlist.userid !== userId) throw new NotFoundException('Unauthorized');

    await this.prisma.playlist.delete({ where: { id: playlistId } });
  }
}
