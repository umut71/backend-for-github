import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ShareService {
  constructor(private prisma: PrismaService) {}

  async trackShare(videoId: string, platform: string) {
    await this.prisma.sharecount.upsert({
      where: { videoid_platform: { videoid: videoId, platform } },
      create: { videoid: videoId, platform, count: 1 },
      update: { count: { increment: 1 } },
    });
  }

  async getShareCounts(videoId: string) {
    return this.prisma.sharecount.findMany({
      where: { videoid: videoId },
    });
  }
}
