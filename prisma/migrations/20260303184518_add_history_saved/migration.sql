-- CreateTable
CREATE TABLE "watchhistory" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "watchedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "watchhistory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savedvideo" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "savedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savedvideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "watchhistory_userid_idx" ON "watchhistory"("userid");

-- CreateIndex
CREATE INDEX "watchhistory_watchedat_idx" ON "watchhistory"("watchedat");

-- CreateIndex
CREATE UNIQUE INDEX "watchhistory_userid_videoid_key" ON "watchhistory"("userid", "videoid");

-- CreateIndex
CREATE INDEX "savedvideo_userid_idx" ON "savedvideo"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "savedvideo_userid_videoid_key" ON "savedvideo"("userid", "videoid");

-- AddForeignKey
ALTER TABLE "watchhistory" ADD CONSTRAINT "watchhistory_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "watchhistory" ADD CONSTRAINT "watchhistory_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savedvideo" ADD CONSTRAINT "savedvideo_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savedvideo" ADD CONSTRAINT "savedvideo_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
