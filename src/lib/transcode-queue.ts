import { Logger } from '@nestjs/common';

/**
 * Transcode kuyruğu yardımcısı.
 *
 * Video upload'ı tamamlandığında transcoder worker'ının dinlediği
 * Redis listesine (buzz:queue:upload_complete) iş yazar.
 * Worker: services/transcoder/worker.js
 *   - BLPOP buzz:queue:upload_complete
 *   - S3'ten indirir, FFmpeg ile HLS (1080p/720p/480p) + thumbnail üretir
 *   - Çıktıyı S3 buzz/hls/<fileId>/ altına yükler
 *   - RPUSH buzz:queue:transcode_done
 *
 * REDIS_URL tanımlı değilse veya ioredis kurulu değilse sessizce atlar
 * (upload akışını ASLA bloklamaz) — feed-cache.service.ts ile aynı desen.
 */

const QUEUE_KEY = 'buzz:queue:upload_complete';

const logger = new Logger('TranscodeQueue');

let redis: any = null;
let initialized = false;

function getRedis(): any {
  if (initialized) return redis;
  initialized = true;

  const url = process.env.REDIS_URL;
  if (!url) {
    logger.log('REDIS_URL tanımlı değil — transcode kuyruğu devre dışı (no-op)');
    return null;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const IORedis = require('ioredis');
    redis = new IORedis(url, {
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
    });
    redis.connect().catch((err: Error) => {
      logger.warn(`Redis bağlantısı kurulamadı, transcode kuyruğu devre dışı: ${err.message}`);
      redis = null;
    });
  } catch {
    logger.warn('ioredis kurulu değil — transcode kuyruğu devre dışı');
    redis = null;
  }
  return redis;
}

export interface TranscodeJob {
  fileId: string;
  s3Key: string;
  bucket?: string;
  userId?: string;
  mimeType?: string;
  queuedAt?: string;
}

/**
 * Transcode işini kuyruğa ekler. Hata durumunda fırlatmaz, sadece loglar
 * — upload response'u asla bloklanmamalı/bozulmamalı.
 */
export async function enqueueTranscode(job: TranscodeJob): Promise<boolean> {
  const client = getRedis();
  if (!client) return false;

  try {
    const payload: TranscodeJob = {
      ...job,
      bucket: job.bucket || process.env.AWS_BUCKET_NAME,
      queuedAt: new Date().toISOString(),
    };
    await client.rpush(QUEUE_KEY, JSON.stringify(payload));
    logger.log(`Transcode işi kuyruğa eklendi: fileId=${job.fileId} key=${job.s3Key}`);
    return true;
  } catch (err) {
    logger.warn(
      `Transcode işi kuyruğa eklenemedi (upload etkilenmedi): ${(err as Error).message}`,
    );
    return false;
  }
}
