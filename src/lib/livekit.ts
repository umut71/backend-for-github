import { Logger } from '@nestjs/common';
import {
  AccessToken,
  RoomServiceClient,
  VideoGrant,
} from 'livekit-server-sdk';

const logger = new Logger('LiveKit');

/**
 * Buzz — LiveKit entegrasyonu (P0-2)
 *
 * Gerekli env değişkenleri:
 *   LIVEKIT_URL        wss://<proje>.livekit.cloud  (veya self-host: wss://live.example.com)
 *   LIVEKIT_API_KEY    API key
 *   LIVEKIT_API_SECRET API secret
 *
 * Env yoksa isConfigured() false döner ve controller 400 verir
 * (mobil taraf fallback moduna geçer).
 */
class LiveKitService {
  private roomService: RoomServiceClient | null = null;

  get url(): string {
    return process.env.LIVEKIT_URL ?? '';
  }

  private get apiKey(): string {
    return process.env.LIVEKIT_API_KEY ?? '';
  }

  private get apiSecret(): string {
    return process.env.LIVEKIT_API_SECRET ?? '';
  }

  isConfigured(): boolean {
    return !!(this.url && this.apiKey && this.apiSecret);
  }

  /**
   * Yayıncı veya izleyici için oda erişim token'ı üretir.
   * identity = userId (moderasyon kick/ban bu identity üzerinden çalışır)
   */
  async createToken(params: {
    roomName: string;
    identity: string;
    name?: string;
    role: 'publisher' | 'viewer';
    ttlSeconds?: number;
  }): Promise<string> {
    const { roomName, identity, name, role, ttlSeconds = 6 * 3600 } = params;

    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      name: name ?? identity,
      ttl: ttlSeconds,
    });

    const grant: VideoGrant = {
      room: roomName,
      roomJoin: true,
      canSubscribe: true,
      canPublish: role === 'publisher',
      canPublishData: true, // chat/data channel herkese açık
    };
    at.addGrant(grant);

    return await at.toJwt();
  }

  private getRoomService(): RoomServiceClient | null {
    if (!this.isConfigured()) return null;
    if (!this.roomService) {
      // RoomServiceClient http(s) URL bekler
      const httpUrl = this.url.replace(/^wss:/, 'https:').replace(/^ws:/, 'http:');
      this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
    }
    return this.roomService;
  }

  /**
   * Moderasyon: katılımcıyı odadan at (kick).
   * Ban için üst katman (livestream service) kullanıcıyı tekrar token almaktan men eder.
   */
  async removeParticipant(roomName: string, identity: string): Promise<boolean> {
    const svc = this.getRoomService();
    if (!svc) return false;
    try {
      await svc.removeParticipant(roomName, identity);
      logger.log(`✅ Participant kicked: ${identity} from ${roomName}`);
      return true;
    } catch (err: any) {
      logger.warn(`Kick failed (${identity}@${roomName}): ${err?.message ?? err}`);
      return false;
    }
  }

  /** Moderasyon: odayı tamamen kapat (yayını sonlandır). */
  async deleteRoom(roomName: string): Promise<boolean> {
    const svc = this.getRoomService();
    if (!svc) return false;
    try {
      await svc.deleteRoom(roomName);
      logger.log(`✅ Room deleted: ${roomName}`);
      return true;
    } catch (err: any) {
      logger.warn(`Room delete failed (${roomName}): ${err?.message ?? err}`);
      return false;
    }
  }
}

export const livekit = new LiveKitService();
