import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import axios from 'axios';

@Injectable()
export class SoundsService {
  private readonly logger = new Logger(SoundsService.name);
  private readonly jamendoUrl = 'https://api.jamendo.com/v3.0';
  private readonly clientId = process.env.JAMENDO_CLIENT_ID;

  constructor(private prisma: PrismaService) {}

  async searchSounds(query: string, limit: number = 20) {
    try {
      const response = await axios.get(`${this.jamendoUrl}/tracks/`, {
        params: {
          client_id: this.clientId,
          format: 'json',
          limit,
          search: query,
          audioformat: 'mp32',
          imagesize: 200,
        },
      });

      return response.data.results.map((track: any) => ({
        jamendoId: track.id,
        name: track.name,
        artist: track.artist_name,
        duration: track.duration,
        audioUrl: track.audio,
        imageUrl: track.image,
      }));
    } catch (error: any) {
      this.logger.error('Jamendo search error:', error?.message);
      throw error;
    }
  }

  async getPopularSounds(limit: number = 20) {
    try {
      const response = await axios.get(`${this.jamendoUrl}/tracks/`, {
        params: {
          client_id: this.clientId,
          format: 'json',
          limit,
          order: 'popularity_total',
          audioformat: 'mp32',
          imagesize: 200,
        },
      });

      return response.data.results.map((track: any) => ({
        jamendoId: track.id,
        name: track.name,
        artist: track.artist_name,
        duration: track.duration,
        audioUrl: track.audio,
        imageUrl: track.image,
      }));
    } catch (error: any) {
      this.logger.error('Jamendo popular error:', error?.message);
      throw error;
    }
  }

  async saveSound(jamendoId: string, name: string, artist: string, duration: number, audioUrl: string, imageUrl?: string) {
    const existing = await this.prisma.sound.findUnique({ where: { jamendoid: jamendoId } });
    if (existing) {
      return existing;
    }

    return this.prisma.sound.create({
      data: {
        jamendoid: jamendoId,
        name,
        artist,
        duration,
        audiourl: audioUrl,
        imageurl: imageUrl,
      },
    });
  }

  async getTrendingSounds(limit: number = 20) {
    return this.prisma.sound.findMany({
      orderBy: { popularity: 'desc' },
      take: limit,
    });
  }

  async incrementSoundPopularity(soundId: string) {
    await this.prisma.sound.update({
      where: { id: soundId },
      data: { popularity: { increment: 1 } },
    });
  }
}
