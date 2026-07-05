# Buzz Transcoder Worker — FFmpeg + Node 20
FROM node:20-alpine

# FFmpeg kurulumu (HLS + thumbnail üretimi için)
RUN apk add --no-cache ffmpeg

WORKDIR /app

COPY package.json ./
RUN npm install --omit=dev

COPY worker.js ./

# Geçici çalışma dizini (indirilen kaynak + üretilen HLS çıktıları)
RUN mkdir -p /tmp/transcode

ENV NODE_ENV=production
CMD ["node", "worker.js"]
