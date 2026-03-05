import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class BlockingService {
  constructor(private prisma: PrismaService) {}

  async blockUser(userId: string, blockedId: string) {
    await this.prisma.blockeduser.create({
      data: { userid: userId, blockedid: blockedId },
    });
  }

  async unblockUser(userId: string, blockedId: string) {
    await this.prisma.blockeduser.deleteMany({
      where: { userid: userId, blockedid: blockedId },
    });
  }

  async getBlockedUsers(userId: string) {
    return this.prisma.blockeduser.findMany({
      where: { userid: userId },
      include: { blocked: { include: { profilePicture: true } } },
    });
  }

  async isBlocked(userId: string, targetId: string): Promise<boolean> {
    const block = await this.prisma.blockeduser.findFirst({
      where: {
        OR: [
          { userid: userId, blockedid: targetId },
          { userid: targetId, blockedid: userId },
        ],
      },
    });
    return !!block;
  }
}
