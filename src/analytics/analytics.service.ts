import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getCreatorAnalytics(userId: string, days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    // Get all user videos
    const videos = await this.prisma.video.findMany({
      where: { userid: userId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    // Get user earnings from gifts (within days)
    const earnings = await this.prisma.earning.findMany({
      where: {
        userid: userId,
        createdat: { gte: cutoffDate },
        status: 'pending',
      },
    });

    const totalEarnings = earnings.reduce((sum, e) => sum + e.amount, 0);
    const giftCount = earnings.length;

    if (!videos || videos.length === 0) {
      return {
        overview: {
          totalViews: 0,
          totalLikes: 0,
          totalComments: 0,
          totalVideos: 0,
          engagementRate: 0,
          avgViewsPerVideo: 0,
          totalEarnings,
          giftCount,
        },
        topVideos: [],
        viewsByDay: [],
      };
    }

    // Calculate total stats
    const totalViews = videos.reduce((sum, v) => sum + v.viewcount, 0);
    const totalLikes = videos.reduce((sum, v) => sum + v.likecount, 0);
    const totalComments = videos.reduce((sum, v) => sum + v.commentcount, 0);
    const totalVideos = videos.length;

    // Calculate engagement rate
    const engagementRate =
      totalViews > 0 ? ((totalLikes + totalComments) / totalViews) * 100 : 0;

    // Get top performing videos
    const topVideos = videos
      .sort((a, b) => b.viewcount - a.viewcount)
      .slice(0, 5)
      .map((v) => ({
        id: v.id,
        title: v.title,
        description: v.description,
        viewCount: v.viewcount,
        likeCount: v.likecount,
        commentCount: v.commentcount,
        engagementRate:
          v.viewcount > 0
            ? ((v.likecount + v.commentcount) / v.viewcount) * 100
            : 0,
        createdAt: v.createdat,
      }));

    // Get recent videos for growth chart
    const recentVideos = videos.filter((v) => v.createdat >= cutoffDate);

    // Group views by day for growth chart
    const viewsByDay = this.groupViewsByDay(recentVideos, days);

    return {
      overview: {
        totalViews,
        totalLikes,
        totalComments,
        totalVideos,
        engagementRate: parseFloat(engagementRate.toFixed(2)),
        avgViewsPerVideo:
          totalVideos > 0 ? Math.round(totalViews / totalVideos) : 0,
        totalEarnings,
        giftCount,
      },
      topVideos,
      viewsByDay,
    };
  }

  async getVideoAnalytics(videoId: string) {
    const video = await this.prisma.video.findUnique({
      where: { id: videoId },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            gifts: true,
          },
        },
        gifts: {
          include: {
            giftType: true,
          },
        },
      },
    });

    if (!video) {
      return null;
    }

    // Calculate engagement metrics
    const engagementRate =
      video.viewcount > 0
        ? ((video.likecount + video.commentcount) / video.viewcount) * 100
        : 0;

    // Calculate gift earnings
    const giftEarnings = video.gifts.reduce(
      (sum, g) => sum + g.giftType.coinvalue * 0.7, // 30% platform commission
      0,
    );

    // Get like-to-view ratio
    const likeRatio =
      video.viewcount > 0 ? (video.likecount / video.viewcount) * 100 : 0;
    const commentRatio =
      video.viewcount > 0 ? (video.commentcount / video.viewcount) * 100 : 0;

    return {
      id: video.id,
      title: video.title,
      description: video.description,
      createdAt: video.createdat,
      viewCount: video.viewcount,
      likeCount: video.likecount,
      commentCount: video.commentcount,
      giftCount: video._count.gifts,
      giftEarnings,
      engagementRate: parseFloat(engagementRate.toFixed(2)),
      likeRatio: parseFloat(likeRatio.toFixed(2)),
      commentRatio: parseFloat(commentRatio.toFixed(2)),
      performance: this.calculatePerformance(
        video.viewcount,
        video.likecount,
        video.commentcount,
      ),
    };
  }

  private groupViewsByDay(videos: any[], days: number) {
    const result: { date: string; views: number }[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const dayVideos = videos.filter(
        (v) => v.createdat >= date && v.createdat < nextDate,
      );

      const views = dayVideos.reduce((sum, v) => sum + v.viewcount, 0);

      result.push({
        date: date.toISOString().split('T')[0],
        views,
      });
    }

    return result;
  }

  private calculatePerformance(
    views: number,
    likes: number,
    comments: number,
  ): string {
    const engagement = views > 0 ? ((likes + comments) / views) * 100 : 0;

    if (engagement >= 10) return 'Excellent';
    if (engagement >= 5) return 'Good';
    if (engagement >= 2) return 'Average';
    return 'Needs Improvement';
  }
}
