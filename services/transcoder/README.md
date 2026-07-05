# Buzz Transcoder Worker

Redis kuyruğundan `upload_complete` işlerini tüketir, FFmpeg ile HLS (1080p/720p/480p)
ve thumbnail üretir, çıktıları S3'e yükler, sonucu `transcode_done` kuyruğuna yazar.

## Mimari

```
backend (upload complete)
   └─ RPUSH buzz:queue:upload_complete  {"fileId","s3Key","bucket","userId"}
transcoder worker
   ├─ BLPOP buzz:queue:upload_complete
   ├─ S3 GET kaynak → /tmp/transcode/<fileId>/source.mp4
   ├─ ffmpeg → HLS 1080p/720p/480p + master.m3u8 + thumbnail.jpg
   ├─ S3 PUT → buzz/hls/<fileId>/...
   └─ RPUSH buzz:queue:transcode_done   {"fileId","masterPlaylist","thumbnail"}
```

## Ortam değişkenleri

| Değişken | Açıklama | Varsayılan |
|---|---|---|
| `REDIS_URL` | Redis bağlantısı | `redis://localhost:6379` |
| `AWS_REGION` | S3 bölgesi | `us-east-1` |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | IAM anahtarı (yoksa dry-run: çıktılar lokal kalır) | — |
| `AWS_BUCKET_NAME` | Hedef bucket | — |
| `AWS_FOLDER_PREFIX` | Key ön eki | `buzz/` |
| `TRANSCODE_TMP` | Geçici dizin | `<os tmp>/transcode` |

## Çalıştırma

```bash
# Lokal
cd services/transcoder && npm install && npm start

# Docker
docker build -t buzz-transcoder .
docker run --rm -e REDIS_URL=redis://host.docker.internal:6379 buzz-transcoder
```

## Test için kuyruğa iş atma

```bash
redis-cli RPUSH buzz:queue:upload_complete '{"fileId":"test1","localPath":"/tmp/sample.mp4"}'
redis-cli BLPOP buzz:queue:transcode_done 60
```

## Örnek FFmpeg komutları (worker'ın kullandığı)

```bash
# 720p HLS varyantı
ffmpeg -y -i source.mp4 -vf scale=-2:720 \
  -c:v libx264 -preset veryfast -b:v 2800k -c:a aac -b:a 128k \
  -hls_time 4 -hls_playlist_type vod \
  -hls_segment_filename out/720p/seg_%03d.ts out/720p/index.m3u8

# Thumbnail (1. saniyeden kare)
ffmpeg -y -ss 1 -i source.mp4 -vframes 1 -vf scale=480:-2 -q:v 3 out/thumbnail.jpg
```

## Notlar

- **Idempotent**: aynı `fileId` yeniden işlenirse çıktılar üzerine yazılır (bozulma olmaz).
- Hatalı işler loglanır ve worker 3 sn bekleyip döngüye devam eder (crash etmez).
- Prodüksiyonda birden fazla worker replika çalıştırılabilir (BLPOP atomik dağıtır).
