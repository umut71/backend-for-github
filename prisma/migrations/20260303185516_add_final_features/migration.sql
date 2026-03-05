-- CreateTable
CREATE TABLE "blockeduser" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "blockedid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blockeduser_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sharecount" (
    "id" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sharecount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "blockeduser_userid_idx" ON "blockeduser"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "blockeduser_userid_blockedid_key" ON "blockeduser"("userid", "blockedid");

-- CreateIndex
CREATE INDEX "sharecount_videoid_idx" ON "sharecount"("videoid");

-- CreateIndex
CREATE UNIQUE INDEX "sharecount_videoid_platform_key" ON "sharecount"("videoid", "platform");

-- AddForeignKey
ALTER TABLE "blockeduser" ADD CONSTRAINT "blockeduser_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blockeduser" ADD CONSTRAINT "blockeduser_blockedid_fkey" FOREIGN KEY ("blockedid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sharecount" ADD CONSTRAINT "sharecount_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
