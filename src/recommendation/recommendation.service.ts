import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private prisma: PrismaService) {}

  async getRecommendations(userid: string) {
    // Kullanıcının izlediği videolar
    const watchedVideos = await this.prisma.watchhistory.findMany({
      where: { userid },
      select: { videoid: true },
    });

    const watchedIds = watchedVideos.map((wh) => wh.videoid);

    // İzlemediği en popüler videolar
    const recommended = await this.prisma.video.findMany({
      where: {
        id: { notIn: watchedIds },
      },
      orderBy: [{ viewcount: 'desc' }],
      take: 20,
    });

    return recommended;
  }
}
