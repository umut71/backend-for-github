-- CreateTable
CREATE TABLE "livestream" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'live',
    "viewercount" INTEGER NOT NULL DEFAULT 0,
    "peakviewers" INTEGER NOT NULL DEFAULT 0,
    "streamkey" TEXT NOT NULL,
    "channelname" TEXT NOT NULL,
    "starttime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endtime" TIMESTAMP(3),
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "livestream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "livestreamviewer" (
    "id" TEXT NOT NULL,
    "livestreamid" TEXT NOT NULL,
    "viewerid" TEXT NOT NULL,
    "jointime" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "livestreamviewer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "livestream_streamkey_key" ON "livestream"("streamkey");

-- CreateIndex
CREATE UNIQUE INDEX "livestream_channelname_key" ON "livestream"("channelname");

-- CreateIndex
CREATE INDEX "livestream_userid_idx" ON "livestream"("userid");

-- CreateIndex
CREATE INDEX "livestream_status_idx" ON "livestream"("status");

-- CreateIndex
CREATE INDEX "livestream_starttime_idx" ON "livestream"("starttime");

-- CreateIndex
CREATE INDEX "livestreamviewer_livestreamid_idx" ON "livestreamviewer"("livestreamid");

-- CreateIndex
CREATE INDEX "livestreamviewer_viewerid_idx" ON "livestreamviewer"("viewerid");

-- CreateIndex
CREATE UNIQUE INDEX "livestreamviewer_livestreamid_viewerid_key" ON "livestreamviewer"("livestreamid", "viewerid");

-- AddForeignKey
ALTER TABLE "livestream" ADD CONSTRAINT "livestream_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livestream" ADD CONSTRAINT "livestream_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livestreamviewer" ADD CONSTRAINT "livestreamviewer_livestreamid_fkey" FOREIGN KEY ("livestreamid") REFERENCES "livestream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "livestreamviewer" ADD CONSTRAINT "livestreamviewer_viewerid_fkey" FOREIGN KEY ("viewerid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
