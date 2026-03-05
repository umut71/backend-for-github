import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

  // Dashboard İstatistikleri
  async getDashboardStats() {
    const [totalUsers, totalVideos, totalLikes, totalComments, bannedUsers] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.video.count(),
      this.prisma.like.count(),
      this.prisma.comment.count(),
      this.prisma.user.count({ where: { isbanned: true } }),
    ]);

    // Son 7 gün için günlük kullanıcı kayıtları
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentUsers = await this.prisma.user.groupBy({
      by: ['createdat'],
      _count: { id: true },
      where: {
        createdat: {
          gte: sevenDaysAgo,
        },
      },
    });

    return {
      totalUsers,
      totalVideos,
      totalLikes,
      totalComments,
      bannedUsers,
      recentSignups: recentUsers.length,
    };
  }

  // Kullanıcı Listesi
  async getAllUsers(page: number = 1, limit: number = 20, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { username: { contains: search, mode: 'insensitive' as const } },
            { email: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: true,
          _count: {
            select: {
              videos: true,
              likes: true,
              comments: true,
              followers: true,
              following: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Password'leri çıkar
    const sanitizedUsers = users.map(({ password, ...user }) => user);

    return {
      users: sanitizedUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Kullanıcı Detayı
  async getUserDetail(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
        videos: {
          orderBy: { createdat: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            videos: true,
            likes: true,
            comments: true,
            followers: true,
            following: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }

  // Kullanıcı Banlama
  async banUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.isbanned) {
      throw new ConflictException('User is already banned');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isbanned: true },
    });
  }

  // Kullanıcı Ban Kaldırma
  async unbanUser(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.isbanned) {
      throw new ConflictException('User is not banned');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { isbanned: false },
    });
  }

  // Kullanıcıya Rol Atama
  async assignRole(userId: string, roleName: string) {
    const [user, role] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.role.findUnique({ where: { name: roleName } }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { roleid: role.id },
      include: { role: true },
    });
  }

  // Roller ve İzinler Listesi
  async getAllRoles() {
    return this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: {
            users: true,
          },
        },
      },
      orderBy: { createdat: 'asc' },
    });
  }

  // Tüm İzinler
  async getAllPermissions() {
    return this.prisma.permission.findMany({
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  // Video Moderation - Get all videos
  async getAllVideos(page = 1, limit = 20, search?: string) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [videos, total] = await Promise.all([
      this.prisma.video.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              email: true,
            },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.video.count({ where }),
    ]);

    return {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Delete video (admin)
  async deleteVideo(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      throw new NotFoundException('Video not found');
    }

    await this.prisma.video.delete({
      where: { id: videoId },
    });

    return {
      success: true,
      message: 'Video deleted successfully',
    };
  }

  // Financial Reports
  async getFinancialReports() {
    // Total revenue from coin purchases
    const coinPurchases = await this.prisma.transaction.aggregate({
      where: { type: 'purchase' },
      _sum: { amount: true },
    });

    // Total gifts sent (coins spent)
    const giftsSent = await this.prisma.transaction.aggregate({
      where: { type: 'gift_sent' },
      _sum: { amount: true },
    });

    // Total premium subscriptions
    const activeSubscriptions = await this.prisma.subscription.count({
      where: { status: 'active' },
    });

    const totalSubscriptionRevenue = await this.prisma.subscription.count({
      where: { status: { in: ['active', 'canceled'] } },
    });

    // Monthly revenue calculation (assuming $4.99 per month average)
    const monthlySubscriptionRevenue = activeSubscriptions * 4.99;

    // Creator earnings (pending payouts)
    const pendingPayouts = await this.prisma.earning.aggregate({
      where: { paidout: false },
      _sum: { amount: true },
    });

    // Creator earnings (paid out)
    const paidOutEarnings = await this.prisma.earning.aggregate({
      where: { paidout: true },
      _sum: { amount: true },
    });

    // Platform commission (30% of gifts)
    const totalGiftsValue = Math.abs((giftsSent._sum?.amount ?? 0));
    const platformCommission = Math.floor(totalGiftsValue * 0.3);

    return {
      coinPurchases: {
        totalCoins: coinPurchases._sum?.amount ?? 0,
        // Assuming $0.01 per coin
        estimatedRevenue: ((coinPurchases._sum?.amount ?? 0) * 0.01).toFixed(2),
      },
      subscriptions: {
        active: activeSubscriptions,
        total: totalSubscriptionRevenue,
        monthlyRevenue: monthlySubscriptionRevenue.toFixed(2),
      },
      creatorEarnings: {
        pending: pendingPayouts._sum?.amount ?? 0,
        paidOut: paidOutEarnings._sum?.amount ?? 0,
      },
      platformRevenue: {
        commissionFromGifts: platformCommission,
        estimatedTotal: (
          platformCommission * 0.01 +
          monthlySubscriptionRevenue
        ).toFixed(2),
      },
    };
  }

  // System Analytics
  async getSystemAnalytics(period: 'day' | 'week' | 'month' | 'year' = 'month') {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'day':
        startDate = new Date(now);
        startDate.setHours(0, 0, 0, 0);
        break;
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

    const [
      newUsers,
      newVideos,
      totalLikes,
      totalComments,
      totalViews,
      totalGifts,
    ] = await Promise.all([
      this.prisma.user.count({ where: { createdat: { gte: startDate } } }),
      this.prisma.video.count({ where: { createdat: { gte: startDate } } }),
      this.prisma.like.count({ where: { createdat: { gte: startDate } } }),
      this.prisma.comment.count({ where: { createdat: { gte: startDate } } }),
      this.prisma.video.aggregate({
        where: { createdat: { gte: startDate } },
        _sum: { viewcount: true },
      }),
      this.prisma.gift.count({ where: { createdat: { gte: startDate } } }),
    ]);

    return {
      period,
      startDate,
      endDate: now,
      metrics: {
        newUsers,
        newVideos,
        totalLikes,
        totalComments,
        totalViews: totalViews._sum?.viewcount ?? 0,
        totalGifts,
      },
    };
  }

  // FRAUD DETECTION - Suspicious Activities
  async getFraudAlerts(page = 1, limit = 20, riskLevel?: 'low' | 'medium' | 'high') {
    const skip = (page - 1) * limit;
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Users with suspicious coin activities
    const suspiciousCoins = await this.prisma.user.findMany({
      where: {
        coinbalance: { gte: 10000 }, // High balance
      },
      include: {
        _count: {
          select: {
            sentGifts: { where: { createdat: { gte: last24h } } },
            receivedGifts: { where: { createdat: { gte: last24h } } },
          },
        },
      },
      take: 50,
    });

    // 2. Users sending too many gifts in short time
    const giftSpammers = await this.prisma.user.findMany({
      where: {
        sentGifts: {
          some: {
            createdat: { gte: last24h },
          },
        },
      },
      include: {
        _count: {
          select: {
            sentGifts: { where: { createdat: { gte: last24h } } },
          },
        },
      },
      take: 50,
    });

    // 3. Users with high earnings in short time
    const suspiciousEarners = await this.prisma.earning.groupBy({
      by: ['userid'],
      where: {
        createdat: { gte: last7d },
        paidout: false,
      },
      _sum: { amount: true },
      _count: { id: true },
      having: {
        amount: { _sum: { gte: 100 } }, // Earned $100+ in 7 days
      },
      orderBy: {
        _sum: {
          amount: 'desc',
        },
      },
      take: 50,
    });

    // 4. Get user details for suspicious earners
    const suspiciousEarnersDetails = await Promise.all(
      suspiciousEarners.map(async (earner: { userid: string; _sum: { amount: number | null }; _count: { id: number } }) => {
        const user = await this.prisma.user.findUnique({
          where: { id: earner.userid },
          select: {
            id: true,
            username: true,
            email: true,
            createdat: true,
          },
        });
        return {
          user,
          totalEarned: earner._sum?.amount ?? 0,
          transactionCount: earner._count?.id ?? 0,
          riskLevel: (earner._sum?.amount ?? 0) > 500 ? 'high' : 'medium',
          reason: 'High earnings in short period',
        };
      }),
    );

    // 5. Users with multiple accounts (same email pattern)
    // This is a simplified check - in production, use more sophisticated methods
    const multiAccountUsers = await this.prisma.$queryRaw<
      { email_prefix: string; count: number }[]
    >`
      SELECT 
        SUBSTRING(email FROM 1 FOR POSITION('@' IN email) - 1) as email_prefix,
        COUNT(*) as count
      FROM "user"
      GROUP BY email_prefix
      HAVING COUNT(*) > 3
      LIMIT 20
    `;

    // Combine all alerts
    const alerts = [
      ...suspiciousEarnersDetails,
      ...suspiciousCoins.map((user) => ({
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          createdat: user.createdat,
        },
        totalEarned: user.coinbalance ?? 0,
        transactionCount:
          (user._count?.sentGifts ?? 0) + (user._count?.receivedGifts ?? 0),
        riskLevel:
          (user.coinbalance ?? 0) > 50000
            ? 'high'
            : (user.coinbalance ?? 0) > 20000
              ? 'medium'
              : 'low',
        reason: 'Unusually high coin balance',
      })),
      ...giftSpammers
        .filter((user) => (user._count?.sentGifts ?? 0) > 20)
        .map((user) => ({
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            createdat: user.createdat,
          },
          totalEarned: 0,
          transactionCount: user._count?.sentGifts ?? 0,
          riskLevel: (user._count?.sentGifts ?? 0) > 100 ? 'high' : 'medium',
          reason: 'Sent too many gifts in 24 hours',
        })),
    ];

    // Filter by risk level if provided
    const filteredAlerts = riskLevel
      ? alerts.filter((alert) => alert.riskLevel === riskLevel)
      : alerts;

    // Sort by risk level
    const sortedAlerts = filteredAlerts.sort((a, b) => {
      const riskOrder: Record<string, number> = { high: 3, medium: 2, low: 1 };
      return (riskOrder[b.riskLevel] ?? 0) - (riskOrder[a.riskLevel] ?? 0);
    });

    const total = sortedAlerts.length;
    const paginatedAlerts = sortedAlerts.slice(skip, skip + limit);

    return {
      alerts: paginatedAlerts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      stats: {
        totalAlerts: total,
        highRisk: alerts.filter((a) => a.riskLevel === 'high').length,
        mediumRisk: alerts.filter((a) => a.riskLevel === 'medium').length,
        lowRisk: alerts.filter((a) => a.riskLevel === 'low').length,
      },
    };
  }

  // Get detailed fraud report for a specific user
  async getUserFraudReport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        _count: {
          select: {
            videos: true,
            sentGifts: true,
            receivedGifts: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const last30d = new Date();
    last30d.setDate(last30d.getDate() - 30);

    // Earnings in last 30 days
    const recentEarnings = await this.prisma.earning.aggregate({
      where: {
        userid: userId,
        createdat: { gte: last30d },
      },
      _sum: { amount: true },
      _count: { id: true },
    });

    // Gifts sent in last 30 days
    const recentGiftsSent = await this.prisma.gift.count({
      where: {
        senderid: userId,
        createdat: { gte: last30d },
      },
    });

    // Gifts received in last 30 days
    const recentGiftsReceived = await this.prisma.gift.count({
      where: {
        receiverid: userId,
        createdat: { gte: last30d },
      },
    });

    // Transaction history (coin purchases)
    const coinPurchases = await this.prisma.transaction.findMany({
      where: {
        userid: userId,
        type: 'purchase',
      },
      orderBy: { createdat: 'desc' },
      take: 10,
    });

    // Payout requests
    const payoutRequests = await this.prisma.earning.findMany({
      where: {
        userid: userId,
        status: { in: ['processing', 'completed'] },
      },
      orderBy: { createdat: 'desc' },
      take: 10,
    });

    // Calculate risk score
    let riskScore = 0;
    const reasons: string[] = [];

    if ((user.coinbalance ?? 0) > 50000) {
      riskScore += 30;
      reasons.push(`High coin balance: ${user.coinbalance}`);
    }

    if ((recentEarnings._sum?.amount ?? 0) > 500) {
      riskScore += 40;
      reasons.push(`High earnings in 30 days: $${recentEarnings._sum?.amount}`);
    }

    if (recentGiftsSent > 100) {
      riskScore += 20;
      reasons.push(`Sent ${recentGiftsSent} gifts in 30 days`);
    }

    if (coinPurchases.length === 0 && (user.coinbalance ?? 0) > 1000) {
      riskScore += 50;
      reasons.push('High balance with no purchase history');
    }

    const accountAge = Math.floor(
      (Date.now() - new Date(user.createdat).getTime()) / (1000 * 60 * 60 * 24),
    );
    if (accountAge < 7 && (recentEarnings._sum?.amount ?? 0) > 100) {
      riskScore += 30;
      reasons.push(`New account (${accountAge} days) with high earnings`);
    }

    const riskLevel =
      riskScore >= 70 ? 'high' : riskScore >= 40 ? 'medium' : 'low';

    return {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        coinBalance: user.coinbalance,
        accountAge: `${accountAge} days`,
        createdAt: user.createdat,
      },
      stats: {
        totalVideos: user._count?.videos ?? 0,
        totalGiftsSent: user._count?.sentGifts ?? 0,
        totalGiftsReceived: user._count?.receivedGifts ?? 0,
        recentGiftsSent,
        recentGiftsReceived,
        recentEarnings: recentEarnings._sum?.amount ?? 0,
        recentEarningsCount: recentEarnings._count?.id ?? 0,
      },
      transactions: {
        coinPurchases: coinPurchases.length,
        recentPurchases: coinPurchases,
        payoutRequests: payoutRequests.length,
        recentPayouts: payoutRequests,
      },
      riskAssessment: {
        riskLevel,
        riskScore,
        reasons,
        recommendation:
          riskLevel === 'high'
            ? 'BLOCK PAYOUT - Manual review required'
            : riskLevel === 'medium'
              ? 'REVIEW - Additional verification recommended'
              : 'APPROVED - Normal activity',
      },
    };
  }
}
