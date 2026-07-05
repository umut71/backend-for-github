# Buzz — Güvenlik Politikası ve Anahtar Rotasyonu

## Gizli Anahtar Yönetimi (Secrets)

- Gerçek anahtarlar **asla** repoya commit edilmez. Sadece `.env.example` şablonları tutulur.
- Prodüksiyon secret'ları Render Dashboard → Environment sekmesinde saklanır.
- Lokal geliştirmede `.env` dosyası kullanılır (`.gitignore`'da).

## Anahtar Rotasyon Politikası (90 gün)

| Anahtar | Rotasyon | Nasıl |
|---|---|---|
| `JWT_SECRET` | 90 günde bir | Yeni değer üret (`openssl rand -base64 48`) → Render env güncelle → deploy. Aktif oturumlar düşer; refresh token akışı yeniden giriş ister. |
| AWS IAM Access Key | 90 günde bir | IAM → yeni access key oluştur → Render env güncelle → doğrula → eski anahtarı devre dışı bırak → 7 gün sonra sil. **İki anahtar dönemi** sıfır kesinti sağlar. |
| `DATABASE_URL` şifresi | 180 günde bir | Neon/DB panelinden şifre yenile → Render env güncelle. |
| `SENTRY_DSN` | Sızıntı şüphesinde | Sentry panelden DSN yenile. |

### AWS anahtar rotasyonu adım adım

```bash
# 1. Yeni anahtar oluştur
aws iam create-access-key --user-name buzz-backend
# 2. Render'da AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY güncelle → redeploy
# 3. Doğrula (presigned upload testi)
node tools/test_multipart.js
# 4. Eski anahtarı devre dışı bırak
aws iam update-access-key --user-name buzz-backend --access-key-id ESKI_ID --status Inactive
# 5. 7 gün sorunsuz geçince sil
aws iam delete-access-key --user-name buzz-backend --access-key-id ESKI_ID
```

## Uygulama Güvenlik Kontrolleri (mevcut)

- **Helmet**: CSP, HSTS vb. HTTP başlık koruması (`src/main.ts`).
- **CORS**: prod'da exact-match allowlist (`ALLOWED_ORIGINS` env).
- **Rate limit**: `@nestjs/throttler` — 10 rps / 60 rpm / 100 per 15 dk; multipart init ayrıca sınırlı.
- **Presigned URL'ler**: 15 dakika geçerli (S3 upload).
- **Şifreler**: bcrypt hash; JWT Bearer doğrulama.
- **Validation**: global `ValidationPipe` (whitelist + transform) — bilinmeyen alanlar atılır.

## IAM En Az Yetki (bkz. infra/terraform/iam.tf)

Backend IAM kullanıcısı yalnızca şu izinlere sahip olmalı:
`s3:PutObject`, `s3:GetObject`, `s3:AbortMultipartUpload`, `s3:ListMultipartUploadParts`
— sadece `arn:aws:s3:::<bucket>/buzz/*` kaynağında. `s3:*` veya `*` ARN vermekten kaçının.

## Olay Müdahalesi (Incident Response)

1. Sızan anahtarı **hemen** devre dışı bırak (yukarıdaki rotasyon adımları, bekleme yok).
2. Render loglarında şüpheli istekleri incele; `/metrics` üzerinden anormal trafik kontrol et.
3. `JWT_SECRET` değiştir → tüm oturumları geçersiz kıl.
4. Etkilenen kullanıcı verisi varsa kayıt altına al (docs/runbooks/incident-log.md önerilir).
