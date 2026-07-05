# Buzz Moderation Worker (Stub)

Transcode tamamlanan videoların thumbnail'lerinde NSFW kontrolü yapar.
Şüpheli içerik insan inceleme kuyruğuna (`buzz:queue:human_review`) düşer.

## Akış

```
transcoder → buzz:queue:transcode_done
moderation worker
   ├─ checkNsfw(thumbnail)          ← ŞU AN STUB (skor 0.05 döner)
   ├─ skor >= NSFW_THRESHOLD (0.7)  → RPUSH buzz:queue:human_review
   └─ skor <  eşik                  → SADD buzz:moderation:approved
apps/admin (inceleme arayüzü stub)  → kuyruktan iş çekip onay/red
```

## Gerçek NSFW entegrasyonu (TODO)

| Seçenek | Not |
|---|---|
| AWS Rekognition `DetectModerationLabels` | S3 ile doğal entegrasyon, ücretli |
| Google Vision SafeSearch | Alternatif bulut |
| nsfwjs (tensorflow.js) | Ücretsiz, self-hosted, CPU'da yavaş |

`worker.js` içindeki `checkNsfw()` fonksiyonunda örnek Rekognition kodu yorum olarak mevcut.

## Çalıştırma

```bash
cd services/moderation && npm install && npm start
```

## İnceleme kuyruğunu görüntüleme

```bash
redis-cli LRANGE buzz:queue:human_review 0 10
redis-cli SMEMBERS buzz:moderation:approved
```

## Admin inceleme arayüzü

`apps/admin/` altında minimal stub var (tek HTML sayfa + basit endpoint önerisi).
Prodüksiyon için: kimlik doğrulamalı Next.js admin paneli önerilir.
