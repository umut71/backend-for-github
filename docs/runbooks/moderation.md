# Runbook — Buzz Moderation Worker

## Servis Özeti

- **Konum**: `services/moderation` — Node 20 (stub NSFW kontrol)
- **Görev**: `buzz:queue:transcode_done` → NSFW skoru → eşik üstü ise `buzz:queue:human_review`, altı ise `buzz:moderation:approved`
- **Env**: `REDIS_URL`, `NSFW_THRESHOLD` (varsayılan 0.7)
- **Admin UI stub**: `apps/admin/index.html`

## Sorun Giderme

### İnceleme kuyruğu şişiyor
```bash
redis-cli LLEN buzz:queue:human_review
redis-cli LRANGE buzz:queue:human_review 0 5
```
- Eşik çok düşükse (`NSFW_THRESHOLD`) her şey insan incelemesine düşer — eşiği yükselt.
- İnsan inceleme kapasitesi yetmiyorsa: eşiği yükselt + örnekleme (her N. video) stratejisi düşün.

### Stub'tan gerçek NSFW'ye geçiş
1. `worker.js` içindeki `checkNsfw()` fonksiyonunu doldurun (Rekognition örneği yorumda hazır).
2. `@aws-sdk/client-rekognition` dependency ekleyin.
3. IAM kullanıcısına `rekognition:DetectModerationLabels` izni verin.
4. Yanlış pozitif oranını izleyin; eşiği kademeli ayarlayın (0.7 → 0.8).

## Karar Akışı (insan inceleme)

- Onay: video feed'e girer (backend `buzz:moderation:approved` set'ini kontrol etmeli — TODO backend entegrasyonu).
- Red: video gizlenir + kullanıcıya bildirim; tekrarlanan ihlalde hesap kısıtlaması (politika dokümanı gerekir).
