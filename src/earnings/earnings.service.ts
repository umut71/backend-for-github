import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class EarningsService {
  constructor(private prisma: PrismaService) {}

  // Get earnings overview
  async getEarningsOverview(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Total earnings (all time)
    const totalEarnings = await this.prisma.earning.aggregate({
      where: { userid: userId },
      _sum: { amount: true },
    });

    // Pending earnings (not paid out)
    const pendingEarnings = await this.prisma.earning.aggregate({
      where: {
        userid: userId,
        paidout: false,
      },
      _sum: { amount: true },
    });

    // Paid out earnings
    const paidOutEarnings = await this.prisma.earning.aggregate({
      where: {
        userid: userId,
        paidout: true,
      },
      _sum: { amount: true },
    });

    // This month's earnings
    const thisMonthStart = new Date();
    thisMonthStart.setDate(1);
    thisMonthStart.setHours(0, 0, 0, 0);

    const thisMonthEarnings = await this.prisma.earning.aggregate({
      where: {
        userid: userId,
        createdat: { gte: thisMonthStart },
      },
      _sum: { amount: true },
    });

    // Gifts received count
    const giftsReceived = await this.prisma.gift.count({
      where: { receiverid: userId },
    });

    return {
      totalEarnings: totalEarnings._sum?.amount ?? 0,
      pendingEarnings: pendingEarnings._sum?.amount ?? 0,
      paidOutEarnings: paidOutEarnings._sum?.amount ?? 0,
      thisMonthEarnings: thisMonthEarnings._sum?.amount ?? 0,
      giftsReceived,
      minimumPayout: 50, // $50 minimum
      canRequestPayout: (pendingEarnings._sum?.amount ?? 0) >= 50,
    };
  }

  // Get earnings history
  async getEarningsHistory(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [earnings, total] = await Promise.all([
      this.prisma.earning.findMany({
        where: { userid: userId },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.earning.count({ where: { userid: userId } }),
    ]);

    return {
      earnings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Request payout
  async requestPayout(userId: string) {
    const pendingEarnings = await this.prisma.earning.aggregate({
      where: {
        userid: userId,
        paidout: false,
      },
      _sum: { amount: true },
    });

    const totalPending = pendingEarnings._sum?.amount ?? 0;

    if (totalPending < 50) {
      throw new BadRequestException(
        `Minimum payout amount is $50. Your pending earnings: $${totalPending}`,
      );
    }

    // Update all pending earnings to 'processing'
    await this.prisma.earning.updateMany({
      where: {
        userid: userId,
        paidout: false,
      },
      data: {
        status: 'processing',
      },
    });

    return {
      success: true,
      amount: totalPending,
      message:
        'Payout request submitted. Processing typically takes 5-7 business days.',
    };
  }

  // Get earnings analytics (daily/monthly breakdown)
  async getEarningsAnalytics(
    userId: string,
    period: 'week' | 'month' | 'year',
  ) {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'year':
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    const earnings = await this.prisma.earning.findMany({
      where: {
        userid: userId,
        createdat: { gte: startDate },
      },
      orderBy: { createdat: 'asc' },
    });

    // Group by date
    const earningsByDate: Record<string, number> = {};

    earnings.forEach((earning) => {
      const date = earning.createdat.toISOString().split('T')[0];
      earningsByDate[date] = (earningsByDate[date] ?? 0) + earning.amount;
    });

    const chartData = Object.entries(earningsByDate).map(([date, amount]) => ({
      date,
      amount,
    }));

    // Earnings by source
    const giftEarnings = earnings
      .filter((e) => e.source === 'gift')
      .reduce((sum, e) => sum + e.amount, 0);

    return {
      period,
      totalEarnings: earnings.reduce((sum, e) => sum + e.amount, 0),
      chartData,
      earningsBySource: {
        gifts: giftEarnings,
      },
    };
  }

  // Admin: Process payout (mark as paid)
  async processPayout(earningIds: string[]) {
    const paidOutAt = new Date();

    await this.prisma.earning.updateMany({
      where: {
        id: { in: earningIds },
      },
      data: {
        paidout: true,
        paidoutat: paidOutAt,
        status: 'completed',
      },
    });

    return {
      success: true,
      count: earningIds.length,
      message: `${earningIds.length} payouts processed`,
    };
  }
}
