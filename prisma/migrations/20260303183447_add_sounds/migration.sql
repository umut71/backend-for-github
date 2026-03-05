-- AlterTable
ALTER TABLE "video" ADD COLUMN     "soundid" TEXT;

-- CreateTable
CREATE TABLE "sound" (
    "id" TEXT NOT NULL,
    "jamendoid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "audiourl" TEXT NOT NULL,
    "imageurl" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sound_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "sound_jamendoid_key" ON "sound"("jamendoid");

-- CreateIndex
CREATE INDEX "sound_popularity_idx" ON "sound"("popularity");

-- CreateIndex
CREATE INDEX "sound_jamendoid_idx" ON "sound"("jamendoid");

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_soundid_fkey" FOREIGN KEY ("soundid") REFERENCES "sound"("id") ON DELETE SET NULL ON UPDATE CASCADE;
