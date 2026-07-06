import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { getFileUrl } from '../lib/s3';
import { livekit } from '../lib/livekit';
import { randomBytes } from 'crypto';
import { RtcTokenBuilder, RtcRole } from 'agora-token';

@Injectable()
export class LivestreamService {
  constructor(private prisma: PrismaService) {}

  /**
   * Yayın bazlı ban listesi (moderasyon MVP).
   * Kalıcılık gerekmez: yayın bittiğinde ban da anlamını yitirir.
   * key: livestreamId, value: banlanan userId seti
   */
  private bannedViewers = new Map<string, Set<string>>();

  /**
   * Start a new live stream
   */
  async startLivestream(
    userId: string,
    title: string,
    thumbnailFileId?: string,
  ): Promise<any> {
    // Check follower count requirement (minimum 1000 followers)
    const followerCount = await this.prisma.follow.count({
      where: {
        followingid: userId,
      },
    });

    if (followerCount < 1000) {
      throw new BadRequestException(
        `You need at least 1,000 followers to go live. You currently have ${followerCount} followers.`,
      );
    }

    // Check if user already has an active stream
    const existingStream = await this.prisma.livestream.findFirst({
      where: {
        userid: userId,
        status: 'live',
      },
    });

    if (existingStream) {
      throw new BadRequestException('You already have an active live stream');
    }

    // Generate unique stream key and channel name
    const streamKey = this.generateStreamKey();
    const channelName = `stream_${userId}_${Date.now()}`;

    const livestream = await this.prisma.livestream.create({
      data: {
        userid: userId,
        title,
        thumbnailfileid: thumbnailFileId,
        streamkey: streamKey,
        channelname: channelName,
        status: 'live',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        thumbnailFile: true,
      },
    });

    return await this.formatLivestreamResponse(livestream);
  }

  async getLivestreamEligibility(userId: string) {
    const [followerCount, activeStream] = await Promise.all([
      this.prisma.follow.count({
        where: {
          followingid: userId,
        },
      }),
      this.prisma.livestream.findFirst({
        where: {
          userid: userId,
          status: 'live',
        },
      }),
    ]);

    return {
      canGoLive: followerCount >= 1000 && !activeStream,
      followerCount,
      requiredFollowers: 1000,
      hasActiveStream: !!activeStream,
      activeStreamId: activeStream?.id || null,
    };
  }

  async getMyActiveLivestream(userId: string) {
    const livestream = await this.prisma.livestream.findFirst({
      where: {
        userid: userId,
        status: 'live',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        thumbnailFile: true,
        _count: {
          select: { viewers: true },
        },
      },
    });

    return livestream ? this.formatLivestreamResponse(livestream) : null;
  }

  /**
   * End a live stream
   */
  async endLivestream(livestreamId: string, userId: string): Promise<void> {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }

    if (livestream.userid !== userId) {
      throw new BadRequestException('You can only end your own live stream');
    }

    await this.prisma.livestream.update({
      where: { id: livestreamId },
      data: {
        status: 'ended',
        endtime: new Date(),
      },
    });

    // LiveKit odasını da kapat (izleyiciler otomatik düşer)
    if (livekit.isConfigured() && livestream.channelname) {
      await livekit.deleteRoom(livestream.channelname);
    }

    this.bannedViewers.delete(livestreamId);
  }

  /**
   * LiveKit erişim token'ı üret (P0-2).
   * role=publisher yalnızca yayın sahibine verilir; diğer herkes viewer.
   */
  async getLivekitToken(
    livestreamId: string,
    userId: string,
    requestedRole: 'publisher' | 'viewer',
  ): Promise<any> {
    if (!livekit.isConfigured()) {
      throw new BadRequestException(
        'LiveKit is not configured (LIVEKIT_URL / LIVEKIT_API_KEY / LIVEKIT_API_SECRET)',
      );
    }

    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
      include: {
        user: { select: { id: true, username: true } },
      },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }
    if (livestream.status !== 'live') {
      throw new BadRequestException('This live stream has ended');
    }

    // Ban kontrolü (moderasyon)
    if (this.bannedViewers.get(livestreamId)?.has(userId)) {
      throw new ForbiddenException('You are banned from this live stream');
    }

    // publisher rolü yalnızca yayın sahibine
    const role: 'publisher' | 'viewer' =
      requestedRole === 'publisher' && livestream.userid === userId
        ? 'publisher'
        : 'viewer';

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { username: true },
    });

    const token = await livekit.createToken({
      roomName: livestream.channelname,
      identity: userId,
      name: user?.username ?? userId,
      role,
    });

    return {
      token,
      url: livekit.url,
      roomName: livestream.channelname,
      role,
    };
  }

  /**
   * Moderasyon: izleyiciyi yayından at (kick) ve istenirse banla.
   * Yalnızca yayın sahibi (veya admin katmanı) çağırabilir.
   */
  async kickViewer(
    livestreamId: string,
    requesterId: string,
    targetUserId: string,
    ban: boolean,
    isAdmin = false,
  ): Promise<any> {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }
    if (!isAdmin && livestream.userid !== requesterId) {
      throw new ForbiddenException('Only the stream owner can moderate');
    }
    if (targetUserId === livestream.userid) {
      throw new BadRequestException('Cannot kick the stream owner');
    }

    // LiveKit'ten at
    let kicked = false;
    if (livekit.isConfigured() && livestream.channelname) {
      kicked = await livekit.removeParticipant(
        livestream.channelname,
        targetUserId,
      );
    }

    // Ban listesine ekle (yeni token alamaz)
    if (ban) {
      if (!this.bannedViewers.has(livestreamId)) {
        this.bannedViewers.set(livestreamId, new Set());
      }
      this.bannedViewers.get(livestreamId)!.add(targetUserId);
    }

    // Viewer kaydını da düş
    await this.leaveLivestream(livestreamId, targetUserId);

    return { success: true, kicked, banned: ban };
  }

  /**
   * Moderasyon (admin): yayını zorla durdur.
   */
  async forceStopLivestream(livestreamId: string): Promise<any> {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }
    if (livestream.status !== 'live') {
      return { success: true, alreadyEnded: true };
    }

    await this.prisma.livestream.update({
      where: { id: livestreamId },
      data: { status: 'ended', endtime: new Date() },
    });

    if (livekit.isConfigured() && livestream.channelname) {
      await livekit.deleteRoom(livestream.channelname);
    }

    this.bannedViewers.delete(livestreamId);
    return { success: true };
  }

  async getLivestreamGifts(livestreamId: string) {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
      select: { userid: true },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }

    const gifts = await this.prisma.gift.findMany({
      where: {
        receiverid: livestream.userid,
        videoid: null,
      },
      include: {
        sender: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        giftType: true,
      },
      orderBy: { createdat: 'desc' },
      take: 50,
    });

    return gifts;
  }

  /**
   * Get all active live streams
   */
  async getActiveLivestreams(): Promise<any[]> {
    const livestreams = await this.prisma.livestream.findMany({
      where: {
        status: 'live',
      },
      orderBy: {
        viewercount: 'desc',
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        thumbnailFile: true,
        _count: {
          select: { viewers: true },
        },
      },
    });

    return Promise.all(
      livestreams.map((ls) => this.formatLivestreamResponse(ls)),
    );
  }

  /**
   * Get specific live stream details
   */
  async getLivestream(livestreamId: string): Promise<any> {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilepictureid: true,
          },
        },
        thumbnailFile: true,
        _count: {
          select: { viewers: true },
        },
      },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }

    return await this.formatLivestreamResponse(livestream);
  }

  /**
   * Join a live stream (add viewer)
   */
  async joinLivestream(livestreamId: string, viewerId: string): Promise<void> {
    const livestream = await this.prisma.livestream.findUnique({
      where: { id: livestreamId },
    });

    if (!livestream) {
      throw new NotFoundException('Live stream not found');
    }

    if (livestream.status !== 'live') {
      throw new BadRequestException('This live stream has ended');
    }

    // Check if already joined
    const existingViewer = await this.prisma.livestreamviewer.findUnique({
      where: {
        livestreamid_viewerid: {
          livestreamid: livestreamId,
          viewerid: viewerId,
        },
      },
    });

    if (!existingViewer) {
      // Add viewer
      await this.prisma.livestreamviewer.create({
        data: {
          livestreamid: livestreamId,
          viewerid: viewerId,
        },
      });

      // Increment viewer count
      const updatedStream = await this.prisma.livestream.update({
        where: { id: livestreamId },
        data: {
          viewercount: { increment: 1 },
        },
      });

      // Update peak viewers if needed
      if (updatedStream.viewercount > updatedStream.peakviewers) {
        await this.prisma.livestream.update({
          where: { id: livestreamId },
          data: {
            peakviewers: updatedStream.viewercount,
          },
        });
      }
    }
  }

  /**
   * Leave a live stream (remove viewer)
   */
  async leaveLivestream(livestreamId: string, viewerId: string): Promise<void> {
    const viewer = await this.prisma.livestreamviewer.findUnique({
      where: {
        livestreamid_viewerid: {
          livestreamid: livestreamId,
          viewerid: viewerId,
        },
      },
    });

    if (viewer) {
      await this.prisma.livestreamviewer.delete({
        where: {
          livestreamid_viewerid: {
            livestreamid: livestreamId,
            viewerid: viewerId,
          },
        },
      });

      // Decrement viewer count
      await this.prisma.livestream.update({
        where: { id: livestreamId },
        data: {
          viewercount: { decrement: 1 },
        },
      });
    }
  }

  /**
   * Get RTC token for Agora
   */
  async getRtcToken(
    channelName: string,
    userId: string,
    role: 'publisher' | 'audience',
  ): Promise<any> {
    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    if (!appId || !appCertificate) {
      throw new BadRequestException('Agora credentials not configured');
    }

    // Generate UID from userId (must be a 32-bit unsigned integer)
    const uid = Math.abs(this.hashCode(userId)) % 2147483647;

    // Token expires in 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Set role
    const agoraRole =
      role === 'publisher' ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

    // Build token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      uid,
      agoraRole,
      privilegeExpiredTs,
      privilegeExpiredTs,
    );

    return {
      token,
      channelName,
      uid,
      appId,
    };
  }

  /**
   * Generate consistent numeric UID from string userId
   */
  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash;
  }

  /**
   * Generate unique stream key
   */
  private generateStreamKey(): string {
    return randomBytes(16).toString('hex');
  }

  /**
   * Format livestream response with file URLs
   */
  private async formatLivestreamResponse(livestream: any): Promise<any> {
    const thumbnailUrl = livestream.thumbnailFile
      ? await getFileUrl(
          livestream.thumbnailFile.cloud_storage_path,
          livestream.thumbnailFile.ispublic,
        )
      : null;

    return {
      id: livestream.id,
      title: livestream.title,
      thumbnailUrl,
      status: livestream.status,
      viewerCount: livestream.viewercount,
      peakViewers: livestream.peakviewers,
      streamKey: livestream.streamkey,
      channelName: livestream.channelname,
      startTime: livestream.starttime,
      endTime: livestream.endtime,
      user: livestream.user,
    };
  }
}
