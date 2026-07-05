# Runbook — Buzz Transcoder Worker

## Servis Özeti

- **Konum**: `services/transcoder` — Node 20 + FFmpeg (Docker: alpine + ffmpeg)
- **Görev**: `buzz:queue:upload_complete` (Redis) → HLS 1080/720/480 + thumbnail → S3 → `buzz:queue:transcode_done`
- **Çalıştırma**: `docker compose up transcoder` veya `cd services/transcoder && npm start`

## Sorun Giderme

### İşler kuyrukta birikiyor (transcode edilmiyor)
```bash
redis-cli LLEN buzz:queue:upload_complete     # kuyruk uzunluğu
docker compose logs transcoder --tail=50      # worker logları
```
- Worker crash ise: 3 sn bekleyip devam eder (crash loop olmaz). Log'da `iş hatası:` satırlarına bak.
- FFmpeg bulunamadıysa: Docker image'ı yeniden build et (`docker compose build transcoder`).

### S3 yükleme hataları
- `AWS_*` env değişkenlerini kontrol et; MinIO'da bucket var mı: http://localhost:9001 (minioadmin/minioadmin).
- S3 yoksa worker **dry-run** modunda çalışır: çıktılar `/tmp/transcode/<fileId>/out` altında kalır.

### Ölçekleme
- Birden fazla replika güvenli: `docker compose up -d --scale transcoder=3` (BLPOP atomik dağıtır).
- CPU yoğun iş: replika başına 1-2 vCPU planlayın; `-preset veryfast` hız/kalite dengesi.

## Test

```bash
redis-cli RPUSH buzz:queue:upload_complete '{"fileId":"test1","localPath":"/tmp/sample.mp4"}'
redis-cli BLPOP buzz:queue:transcode_done 120   # sonuç JSON'ı döner
```
