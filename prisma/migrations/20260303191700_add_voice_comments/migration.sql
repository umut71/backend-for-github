-- CreateTable
CREATE TABLE "voicecomment" (
    "id" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "audiourl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "voicecomment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "voicecomment_videoid_idx" ON "voicecomment"("videoid");

-- CreateIndex
CREATE INDEX "voicecomment_userid_idx" ON "voicecomment"("userid");

-- AddForeignKey
ALTER TABLE "voicecomment" ADD CONSTRAINT "voicecomment_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "voicecomment" ADD CONSTRAINT "voicecomment_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
