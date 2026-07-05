/**
 * Buzz Moderation Worker (ADIM 7 stub)
 *
 * Akış:
 *   1. "buzz:queue:transcode_done" kuyruğundan iş çeker (thumbnail hazır).
 *   2. NSFW kontrolü yapar — ŞU AN STUB: checkNsfw() her zaman skor döner.
 *      Gerçek entegrasyon adayları: AWS Rekognition, Google Vision SafeSearch,
 *      open-source nsfwjs (tensorflow.js).
 *   3. Skor eşiği aşarsa "buzz:queue:human_review" kuyruğuna yazar,
 *      aşmazsa "buzz:moderation:approved" set'ine ekler.
 *
 * Ortam değişkenleri: REDIS_URL, NSFW_THRESHOLD (vars. 0.7)
 */
const QUEUE_IN = 'buzz:queue:transcode_done';
const QUEUE_REVIEW = 'buzz:queue:human_review';
const SET_APPROVED = 'buzz:moderation:approved';
const THRESHOLD = parseFloat(process.env.NSFW_THRESHOLD || '0.7');

function log(msg) {
  console.log(`[moderation] ${new Date().toISOString()} ${msg}`);
}

/**
 * NSFW kontrolü — STUB.
 * TODO: gerçek servis entegrasyonu (Rekognition DetectModerationLabels vb.)
 * Şimdilik deterministik düşük skor döner (her şey onaylanır).
 * @param {string} thumbnailKey S3 üzerindeki thumbnail anahtarı
 * @returns {Promise<{score: number, labels: string[]}>}
 */
async function checkNsfw(thumbnailKey) {
  // --- STUB BAŞLANGIÇ ---
  // Gerçek implementasyon örneği (AWS Rekognition):
  //   const { RekognitionClient, DetectModerationLabelsCommand } = require('@aws-sdk/client-rekognition');
  //   const res = await client.send(new DetectModerationLabelsCommand({
  //     Image: { S3Object: { Bucket: process.env.AWS_BUCKET_NAME, Name: thumbnailKey } },
  //     MinConfidence: 50,
  //   }));
  //   return { score: maxConfidence/100, labels: res.ModerationLabels.map(l => l.Name) };
  void thumbnailKey;
  return { score: 0.05, labels: [] };
  // --- STUB SON ---
}

async function processJob(job, redis) {
  const { fileId, thumbnail } = job;
  const { score, labels } = await checkNsfw(thumbnail);

  if (score >= THRESHOLD) {
    // İnsan incelemesine gönder
    await redis.rpush(
      QUEUE_REVIEW,
      JSON.stringify({
        fileId,
        thumbnail,
        nsfwScore: score,
        labels,
        queuedAt: new Date().toISOString(),
      }),
    );
    log(`fileId=${fileId} insan incelemesine gönderildi (skor=${score})`);
  } else {
    await redis.sadd(SET_APPROVED, String(fileId));
    log(`fileId=${fileId} otomatik onaylandı (skor=${score})`);
  }
}

async function main() {
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const popper = new Redis(redisUrl, { maxRetriesPerRequest: null });
  redis.on('error', (e) => log(`redis hata: ${e.message}`));
  popper.on('error', () => {});

  log(`moderation worker başladı — kuyruk: ${QUEUE_IN} (eşik: ${THRESHOLD})`);

  for (;;) {
    try {
      const res = await popper.blpop(QUEUE_IN, 30);
      if (!res) continue;
      const job = JSON.parse(res[1]);
      if (!job.fileId) continue;
      await processJob(job, redis);
    } catch (e) {
      log(`iş hatası: ${e.message}`);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[moderation] ölümcül hata:', e);
    process.exit(1);
  });
}

module.exports = { checkNsfw };
