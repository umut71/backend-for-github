-- CreateTable
CREATE TABLE "story" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "videofileid" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresat" TIMESTAMP(3) NOT NULL,
    "viewcount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "story_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storyview" (
    "id" TEXT NOT NULL,
    "storyid" TEXT NOT NULL,
    "viewerid" TEXT NOT NULL,
    "viewedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storyview_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "story_userid_idx" ON "story"("userid");

-- CreateIndex
CREATE INDEX "story_expiresat_idx" ON "story"("expiresat");

-- CreateIndex
CREATE INDEX "story_createdat_idx" ON "story"("createdat");

-- CreateIndex
CREATE INDEX "storyview_storyid_idx" ON "storyview"("storyid");

-- CreateIndex
CREATE INDEX "storyview_viewerid_idx" ON "storyview"("viewerid");

-- CreateIndex
CREATE UNIQUE INDEX "storyview_storyid_viewerid_key" ON "storyview"("storyid", "viewerid");

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_videofileid_fkey" FOREIGN KEY ("videofileid") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story" ADD CONSTRAINT "story_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyview" ADD CONSTRAINT "storyview_storyid_fkey" FOREIGN KEY ("storyid") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storyview" ADD CONSTRAINT "storyview_viewerid_fkey" FOREIGN KEY ("viewerid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
