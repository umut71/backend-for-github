import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class VoiceCommentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    videoId: string,
    userId: string,
    audioUrl: string,
    duration: number,
  ) {
    const voiceComment = await this.prisma.voicecomment.create({
      data: {
        videoid: videoId,
        userid: userId,
        audiourl: audioUrl,
        duration,
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
    });

    return voiceComment;
  }

  async getByVideo(videoId: string) {
    return this.prisma.voicecomment.findMany({
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
    });
  }

  async delete(id: string, userId: string) {
    const voiceComment = await this.prisma.voicecomment.findUnique({
      where: { id },
    });

    if (!voiceComment || voiceComment.userid !== userId) {
      throw new Error('Unauthorized');
    }

    await this.prisma.voicecomment.delete({ where: { id } });
  }
}
