# Buzz — Dokümantasyon Dizini

| Doküman | İçerik |
|---|---|
| [security.md](./security.md) | Gizli anahtar yönetimi, 90 günlük rotasyon politikası, IAM en az yetki, olay müdahalesi |
| [runbooks/backend.md](./runbooks/backend.md) | Backend işletme: deploy/rollback, migration + rollback planı, sorun giderme, izleme |
| [runbooks/transcoder.md](./runbooks/transcoder.md) | Transcoder worker işletme: kuyruk, FFmpeg, ölçekleme |
| [runbooks/moderation.md](./runbooks/moderation.md) | Moderasyon worker: NSFW eşiği, insan inceleme akışı |

## Hızlı Başlangıç (yerel tam stack)

```bash
cd backend-for-github
docker compose up -d      # Postgres + Redis + MinIO + backend + worker'lar
# veya: make dev
curl http://localhost:3000/health
```

## Test

```bash
make test    # jest birim testleri
make e2e     # playwright uçtan uca (signup→login→upload→publish→like→feed)
```

## Mimari Özet

```
buzz-mobile (Expo/Electron)          buzz-web (Next.js/Netlify)
        │                                   │
        └────────────► backend (NestJS, Render) ◄───────────┘
                        │  Prisma → Postgres (Neon)
                        │  /metrics → Prometheus/Grafana
                        │  presigned upload → S3 (AWS / MinIO lokal)
                        ▼
             Redis kuyrukları
        upload_complete → transcoder (FFmpeg→HLS) → transcode_done
                                                   → moderation (NSFW) → human_review
```
