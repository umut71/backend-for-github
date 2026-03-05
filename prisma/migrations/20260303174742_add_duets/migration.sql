-- AlterTable
ALTER TABLE "video" ADD COLUMN     "isduet" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "originalvideoid" TEXT;

-- CreateIndex
CREATE INDEX "video_originalvideoid_idx" ON "video"("originalvideoid");

-- CreateIndex
CREATE INDEX "video_isduet_idx" ON "video"("isduet");

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_originalvideoid_fkey" FOREIGN KEY ("originalvideoid") REFERENCES "video"("id") ON DELETE SET NULL ON UPDATE CASCADE;
