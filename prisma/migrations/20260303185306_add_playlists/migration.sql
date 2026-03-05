-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlistvideo" (
    "id" TEXT NOT NULL,
    "playlistid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "addedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "playlistvideo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "playlist_userid_idx" ON "playlist"("userid");

-- CreateIndex
CREATE INDEX "playlistvideo_playlistid_idx" ON "playlistvideo"("playlistid");

-- CreateIndex
CREATE UNIQUE INDEX "playlistvideo_playlistid_videoid_key" ON "playlistvideo"("playlistid", "videoid");

-- AddForeignKey
ALTER TABLE "playlist" ADD CONSTRAINT "playlist_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlistvideo" ADD CONSTRAINT "playlistvideo_playlistid_fkey" FOREIGN KEY ("playlistid") REFERENCES "playlist"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlistvideo" ADD CONSTRAINT "playlistvideo_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
