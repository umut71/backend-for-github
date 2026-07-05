# Runbook — Buzz Backend (NestJS)

## Servis Özeti

- **Prod**: https://buzz-backend-na24.onrender.com (Render, main branch push = otomatik deploy!)
- **Lokal**: `npm run build && node dist/src/main.js` (port 3000) veya `make dev`
- **Sağlık**: `GET /health` — DB + bellek kontrolleri döner
- **Metrikler**: `GET /metrics` — Prometheus formatı
- **API Doküman**: `GET /api-docs` (Swagger)

## Sık Karşılaşılan Sorunlar

### 1. Backend başlamıyor / crash loop
```bash
# Logları kontrol et (lokal)
type c:\Users\MyPc\Desktop\Buzz\backend_local_run.log
# En sık nedenler: DATABASE_URL yanlış, prisma generate eksik, port kullanımda
npx prisma generate
netstat -ano | findstr :3000
```

### 2. 500 hataları artışı
- `/metrics` → `buzz_http_requests_total{status="500"}` hangi route'ta artıyor?
- Sentry etkinse (SENTRY_DSN) hata detayları oradadır.
- DB bağlantısı: `/health` içindeki `database.responseTime` değerine bak.

### 3. Upload 503 / S3 hataları
- `AWS_ACCESS_KEY_ID` geçersiz → Render env'de anahtarları yenile (bkz. docs/security.md).
- Lokal geliştirmede fallback: `POST /api/upload/local`.

### 4. Rate limit (429) şikayetleri
- Throttler limitleri `src/app.module.ts` içinde; meşru trafikse limitleri yükselt + deploy.

## Deploy / Rollback

```bash
# Deploy (DİKKAT: main'e push otomatik prod deploy tetikler!)
git push origin main

# Rollback — bir önceki commit'e dön
git revert HEAD --no-edit && git push origin main
# veya Render Dashboard → Deploys → önceki başarılı deploy → "Rollback"
```

## Veritabanı Migrasyonu

```bash
# Şema değişikliği sonrası (dev)
npx prisma db push          # hızlı, migration dosyasız (dev için)
# Prod için migration ile:
npx prisma migrate dev --name <aciklama>   # lokalde migration üret
git add prisma/migrations && git commit    # migration'ı commit'le
# Render deploy sırasında: npx prisma migrate deploy
```

### Migration geri alma (rollback) planı
1. Migration'lar **geriye dönük uyumlu** yazılmalı (önce kolon ekle, kod geç, sonra eski kolonu kaldır — iki ayrı release).
2. Bozuk migration prod'a çıktıysa: `git revert` ile kodu geri al → yeni "down" migration yaz (kolon/tablo geri ekle) → deploy.
3. Veri kaybı riski varsa önce yedek: Neon/PG panelden snapshot veya `pg_dump`.

## İzleme

- Prometheus scrape: `GET /metrics` (30s aralık önerilir)
- Grafana dashboard: `infra/grafana/buzz-dashboard.json` import edin
- Uyarı önerileri: 5xx oranı > %2 (5 dk), p95 gecikme > 1 sn, bellek RSS > 450MB (Render free tier)
