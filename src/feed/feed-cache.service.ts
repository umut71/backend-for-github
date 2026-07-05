import { Injectable, Logger } from '@nestjs/common';

/**
 * Kullanıcı başına feed cache'i.
 * REDIS_URL tanımlı ve ioredis kuruluysa Redis kullanır;
 * aksi halde bellek-içi TTL cache'e düşer (graceful fallback).
 */
@Injectable()
export class FeedCacheService {
  private readonly logger = new Logger(FeedCacheService.name);
  private readonly memory = new Map<string, { value: unknown; expires: number }>();
  private redis: any = null;

  constructor() {
    const url = process.env.REDIS_URL;
    if (!url) return;
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const IORedis = require('ioredis');
      this.redis = new IORedis(url, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableOfflineQueue: false,
      });
      this.redis.connect().catch((err: Error) => {
        this.logger.warn(`Redis bağlantısı kurulamadı, bellek cache: ${err.message}`);
        this.redis = null;
      });
    } catch {
      this.logger.warn('ioredis kurulu değil, bellek-içi cache kullanılıyor');
      this.redis = null;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.redis) {
      try {
        const raw = await this.redis.get(key);
        return raw ? (JSON.parse(raw) as T) : null;
      } catch {
        /* redis hatasında belleğe düş */
      }
    }
    const entry = this.memory.get(key);
    if (entry && entry.expires > Date.now()) return entry.value as T;
    this.memory.delete(key);
    return null;
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    if (this.redis) {
      try {
        await this.redis.set(key, JSON.stringify(value), 'EX', ttlSeconds);
        return;
      } catch {
        /* redis hatasında belleğe düş */
      }
    }
    // Bellek cache'inin sınırsız büyümesini engelle
    if (this.memory.size > 5000) this.memory.clear();
    this.memory.set(key, { value, expires: Date.now() + ttlSeconds * 1000 });
  }
}
