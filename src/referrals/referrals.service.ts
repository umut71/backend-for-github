import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  async generateReferralCode(userId: string): Promise<string> {
    const { nanoid } = await import('nanoid');
    const code = nanoid(8).toUpperCase();
    await this.prisma.referral.create({
      data: {
        referrerid: userId,
        code,
      },
    });
    return code;
  }

  async getUserReferralCode(userId: string): Promise<string> {
    const existing = await this.prisma.referral.findFirst({
      where: { referrerid: userId },
      orderBy: { createdat: 'desc' },
    });

    if (existing) return existing.code;

    return this.generateReferralCode(userId);
  }

  async applyReferralCode(code: string, newUserId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { code },
    });

    if (!referral || referral.status !== 'pending') {
      throw new Error('Invalid or expired referral code');
    }

    // Update referral
    await this.prisma.referral.update({
      where: { code },
      data: {
        referredid: newUserId,
        status: 'completed',
        completedat: new Date(),
      },
    });

    // Reward both users
    await this.prisma.user.update({
      where: { id: referral.referrerid },
      data: { coinbalance: { increment: referral.reward } },
    });

    await this.prisma.user.update({
      where: { id: newUserId },
      data: { coinbalance: { increment: 50 } }, // Bonus for new user
    });
  }

  async getReferralStats(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerid: userId },
      include: {
        referred: { select: { id: true, username: true, createdat: true } },
      },
      orderBy: { createdat: 'desc' },
    });

    const totalReferred = referrals.filter(
      (r) => r.status === 'completed',
    ).length;
    const totalEarned = totalReferred * 100;
    const pending = referrals.filter((r) => r.status === 'pending').length;

    return {
      totalReferred,
      totalEarned,
      pending,
      referrals: referrals.map((r) => ({
        code: r.code,
        status: r.status,
        reward: r.reward,
        createdAt: r.createdat,
        completedAt: r.completedat,
        referred: r.referred
          ? {
              username: r.referred.username,
              joinedAt: r.referred.createdat,
            }
          : null,
      })),
    };
  }
}
