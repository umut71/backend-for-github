import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // Create report
  async createReport(
    reporterId: string,
    reportedType: 'user' | 'video' | 'comment',
    reason: string,
    description: string | undefined,
    reportedUserId?: string,
    reportedVideoId?: string,
    reportedCommentId?: string,
  ) {
    // Validate that at least one reported entity is provided
    if (!reportedUserId && !reportedVideoId && !reportedCommentId) {
      throw new BadRequestException('Must specify what to report');
    }

    // Create report
    const report = await this.prisma.report.create({
      data: {
        reporterid: reporterId,
        reportedtype: reportedType,
        reason,
        description,
        reporteduserid: reportedUserId,
        reportedvideoid: reportedVideoId,
        reportedcommentid: reportedCommentId,
        status: 'pending',
      },
    });

    return {
      success: true,
      report: {
        id: report.id,
        status: report.status,
        createdAt: report.createdat,
      },
      message: 'Report submitted successfully. Our team will review it shortly.',
    };
  }

  // Get user's reports
  async getUserReports(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where: { reporterid: userId },
        include: {
          reportedUser: {
            select: { id: true, username: true },
          },
          reportedVideo: {
            select: { id: true, title: true },
          },
          reportedComment: {
            select: { id: true, text: true },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where: { reporterid: userId } }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Get all reports (admin)
  async getAllReports(
    status?: string,
    reportedType?: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (reportedType) {
      where.reportedtype = reportedType;
    }

    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, username: true },
          },
          reportedUser: {
            select: { id: true, username: true },
          },
          reportedVideo: {
            select: { id: true, title: true, user: { select: { username: true } } },
          },
          reportedComment: {
            select: { id: true, text: true, user: { select: { username: true } } },
          },
        },
        orderBy: { createdat: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count({ where }),
    ]);

    return {
      reports,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  // Resolve report (admin)
  async resolveReport(
    reportId: string,
    resolvedBy: string,
    action: 'approved' | 'rejected',
  ) {
    const report = await this.prisma.report.findUnique({
      where: { id: reportId },
    });

    if (!report) {
      throw new NotFoundException('Report not found');
    }

    const resolvedAt = new Date();

    const updatedReport = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: action,
        resolvedby: resolvedBy,
        resolvedat: resolvedAt,
      },
    });

    return {
      success: true,
      report: updatedReport,
      message: `Report ${action === 'approved' ? 'approved' : 'rejected'} successfully`,
    };
  }

  // Get report stats (admin)
  async getReportStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.prisma.report.count(),
      this.prisma.report.count({ where: { status: 'pending' } }),
      this.prisma.report.count({ where: { status: 'approved' } }),
      this.prisma.report.count({ where: { status: 'rejected' } }),
    ]);

    // Reports by type
    const userReports = await this.prisma.report.count({
      where: { reportedtype: 'user' },
    });
    const videoReports = await this.prisma.report.count({
      where: { reportedtype: 'video' },
    });
    const commentReports = await this.prisma.report.count({
      where: { reportedtype: 'comment' },
    });

    return {
      total,
      byStatus: {
        pending,
        approved,
        rejected,
      },
      byType: {
        user: userReports,
        video: videoReports,
        comment: commentReports,
      },
    };
  }
}
