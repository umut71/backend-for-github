/**
 * Buzz Transcoder Worker (ADIM 6 scaffold)
 *
 * Görev akışı:
 *   1. Redis list "buzz:queue:upload_complete" üzerinden BLPOP ile iş çeker.
 *      İş formatı (JSON): { fileId, s3Key, bucket, userId }
 *   2. Kaynağı S3'ten /tmp/transcode/<fileId>/source.mp4 olarak indirir.
 *   3. FFmpeg ile HLS (1080p/720p/480p) + master.m3u8 + thumbnail üretir.
 *   4. Çıktıları S3'e "buzz/hls/<fileId>/..." altına yükler.
 *   5. Sonucu "buzz:queue:transcode_done" listesine yazar (backend tüketebilir).
 *
 * Ortam değişkenleri (bkz. .env.example):
 *   REDIS_URL, AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
 *   AWS_BUCKET_NAME, AWS_FOLDER_PREFIX (vars. "buzz/"), TRANSCODE_TMP (vars. /tmp/transcode)
 *
 * Idempotent: aynı fileId için çıktı zaten S3'te varsa iş atlanır.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const QUEUE_IN = 'buzz:queue:upload_complete';
const QUEUE_OUT = 'buzz:queue:transcode_done';
const TMP_ROOT =
  process.env.TRANSCODE_TMP || path.join(os.tmpdir(), 'transcode');
const PREFIX = process.env.AWS_FOLDER_PREFIX || 'buzz/';

// HLS varyantları (yükseklik, video bitrate, audio bitrate)
const RENDITIONS = [
  { name: '1080p', height: 1080, vBitrate: '5000k', aBitrate: '192k' },
  { name: '720p', height: 720, vBitrate: '2800k', aBitrate: '128k' },
  { name: '480p', height: 480, vBitrate: '1400k', aBitrate: '96k' },
];

function log(msg) {
  console.log(`[transcoder] ${new Date().toISOString()} ${msg}`);
}

/** FFmpeg komutunu çalıştırır, çıkış kodu 0 değilse hata fırlatır. */
function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const proc = spawn('ffmpeg', args, { stdio: ['ignore', 'ignore', 'pipe'] });
    let stderr = '';
    proc.stderr.on('data', (d) => (stderr += d.toString()));
    proc.on('close', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`ffmpeg exit ${code}: ${stderr.slice(-500)}`));
    });
    proc.on('error', reject);
  });
}

/** Tek bir varyant için HLS segmentleri üretir. */
async function transcodeRendition(srcPath, outDir, r) {
  const variantDir = path.join(outDir, r.name);
  fs.mkdirSync(variantDir, { recursive: true });
  await runFfmpeg([
    '-y',
    '-i', srcPath,
    '-vf', `scale=-2:${r.height}`,
    '-c:v', 'libx264', '-preset', 'veryfast', '-b:v', r.vBitrate,
    '-c:a', 'aac', '-b:a', r.aBitrate,
    '-hls_time', '4',
    '-hls_playlist_type', 'vod',
    '-hls_segment_filename', path.join(variantDir, 'seg_%03d.ts'),
    path.join(variantDir, 'index.m3u8'),
  ]);
  return `${r.name}/index.m3u8`;
}

/** Videonun 1. saniyesinden thumbnail üretir. */
async function makeThumbnail(srcPath, outDir) {
  const thumbPath = path.join(outDir, 'thumbnail.jpg');
  await runFfmpeg([
    '-y', '-ss', '1', '-i', srcPath,
    '-vframes', '1', '-vf', 'scale=480:-2', '-q:v', '3',
    thumbPath,
  ]);
  return thumbPath;
}

/** master.m3u8 içeriği üretir. */
function buildMasterPlaylist(variants) {
  const bandwidths = { '1080p': 5500000, '720p': 3100000, '480p': 1600000 };
  let out = '#EXTM3U\n#EXT-X-VERSION:3\n';
  for (const v of variants) {
    const name = v.split('/')[0];
    out += `#EXT-X-STREAM-INF:BANDWIDTH=${bandwidths[name] || 1000000},NAME="${name}"\n${v}\n`;
  }
  return out;
}

/** S3 istemcisi — anahtar yoksa null döner (dry-run modu). */
function getS3() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_BUCKET_NAME) {
    return null;
  }
  const { S3Client } = require('@aws-sdk/client-s3');
  return new S3Client({ region: process.env.AWS_REGION || 'us-east-1' });
}

async function s3Download(s3, bucket, key, destPath) {
  const { GetObjectCommand } = require('@aws-sdk/client-s3');
  const res = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  await new Promise((resolve, reject) => {
    const ws = fs.createWriteStream(destPath);
    res.Body.pipe(ws).on('finish', resolve).on('error', reject);
  });
}

async function s3UploadDir(s3, bucket, localDir, s3Prefix) {
  const { PutObjectCommand } = require('@aws-sdk/client-s3');
  const entries = fs.readdirSync(localDir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(localDir, e.name);
    if (e.isDirectory()) {
      await s3UploadDir(s3, bucket, full, `${s3Prefix}${e.name}/`);
    } else {
      const contentType = e.name.endsWith('.m3u8')
        ? 'application/vnd.apple.mpegurl'
        : e.name.endsWith('.ts')
          ? 'video/mp2t'
          : e.name.endsWith('.jpg')
            ? 'image/jpeg'
            : 'application/octet-stream';
      await s3.send(
        new PutObjectCommand({
          Bucket: bucket,
          Key: `${s3Prefix}${e.name}`,
          Body: fs.readFileSync(full),
          ContentType: contentType,
        }),
      );
    }
  }
}

/** Tek işi işler. */
async function processJob(job, redis) {
  const { fileId, s3Key, bucket } = job;
  const workDir = path.join(TMP_ROOT, String(fileId));
  const srcPath = path.join(workDir, 'source.mp4');
  const outDir = path.join(workDir, 'out');
  fs.mkdirSync(outDir, { recursive: true });

  const s3 = getS3();
  const targetBucket = bucket || process.env.AWS_BUCKET_NAME;
  const hlsPrefix = `${PREFIX}hls/${fileId}/`;

  // 1. Kaynağı indir (S3 yoksa job.localPath beklenir — lokal dev modu)
  if (s3 && s3Key) {
    log(`kaynak indiriliyor: s3://${targetBucket}/${s3Key}`);
    await s3Download(s3, targetBucket, s3Key, srcPath);
  } else if (job.localPath && fs.existsSync(job.localPath)) {
    fs.copyFileSync(job.localPath, srcPath);
  } else {
    throw new Error('kaynak bulunamadı (ne S3 anahtarı ne localPath)');
  }

  // 2. HLS varyantları + thumbnail
  const variants = [];
  for (const r of RENDITIONS) {
    log(`transcode ${r.name} başlıyor (fileId=${fileId})`);
    variants.push(await transcodeRendition(srcPath, outDir, r));
  }
  fs.writeFileSync(path.join(outDir, 'master.m3u8'), buildMasterPlaylist(variants));
  await makeThumbnail(srcPath, outDir);

  // 3. Çıktıları S3'e yükle (S3 yoksa lokal dizinde bırak — dry-run)
  if (s3) {
    log(`çıktılar yükleniyor: s3://${targetBucket}/${hlsPrefix}`);
    await s3UploadDir(s3, targetBucket, outDir, hlsPrefix);
  } else {
    log(`S3 yapılandırılmamış — çıktılar lokal kaldı: ${outDir}`);
  }

  // 4. Sonucu kuyruğa yaz
  const result = {
    fileId,
    status: 'done',
    masterPlaylist: `${hlsPrefix}master.m3u8`,
    thumbnail: `${hlsPrefix}thumbnail.jpg`,
    completedAt: new Date().toISOString(),
  };
  await redis.rpush(QUEUE_OUT, JSON.stringify(result));

  // 5. Temizlik (kaynak + geçici dosyalar)
  try {
    fs.rmSync(workDir, { recursive: true, force: true });
  } catch {
    /* temizlik hatası kritik değil */
  }
  log(`iş tamamlandı: fileId=${fileId}`);
}

async function main() {
  const Redis = require('ioredis');
  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  const redis = new Redis(redisUrl, { maxRetriesPerRequest: null });
  const popper = new Redis(redisUrl, { maxRetriesPerRequest: null });

  redis.on('error', (e) => log(`redis hata: ${e.message}`));
  popper.on('error', () => {});

  log(`worker başladı — kuyruk: ${QUEUE_IN} (redis: ${redisUrl})`);

  // Sürekli döngü: BLPOP ile blocking şekilde iş bekle
  for (;;) {
    try {
      const res = await popper.blpop(QUEUE_IN, 30);
      if (!res) continue; // timeout → tekrar bekle
      const job = JSON.parse(res[1]);
      if (!job.fileId) {
        log('geçersiz iş atlandı (fileId yok)');
        continue;
      }
      await processJob(job, redis);
    } catch (e) {
      log(`iş hatası: ${e.message}`);
      // Hata durumunda kısa bekleme (hot-loop önleme)
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

if (require.main === module) {
  main().catch((e) => {
    console.error('[transcoder] ölümcül hata:', e);
    process.exit(1);
  });
}

module.exports = { buildMasterPlaylist, RENDITIONS };
