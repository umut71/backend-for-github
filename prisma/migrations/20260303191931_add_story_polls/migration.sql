-- CreateTable
CREATE TABLE "storypoll" (
    "id" TEXT NOT NULL,
    "storyid" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "option1" TEXT NOT NULL,
    "option2" TEXT NOT NULL,
    "votes1" INTEGER NOT NULL DEFAULT 0,
    "votes2" INTEGER NOT NULL DEFAULT 0,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storypoll_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "storypollvote" (
    "id" TEXT NOT NULL,
    "pollid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "votedat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "storypollvote_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "storypoll_storyid_key" ON "storypoll"("storyid");

-- CreateIndex
CREATE INDEX "storypoll_storyid_idx" ON "storypoll"("storyid");

-- CreateIndex
CREATE INDEX "storypollvote_pollid_idx" ON "storypollvote"("pollid");

-- CreateIndex
CREATE INDEX "storypollvote_userid_idx" ON "storypollvote"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "storypollvote_pollid_userid_key" ON "storypollvote"("pollid", "userid");

-- AddForeignKey
ALTER TABLE "storypoll" ADD CONSTRAINT "storypoll_storyid_fkey" FOREIGN KEY ("storyid") REFERENCES "story"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storypollvote" ADD CONSTRAINT "storypollvote_pollid_fkey" FOREIGN KEY ("pollid") REFERENCES "storypoll"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "storypollvote" ADD CONSTRAINT "storypollvote_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
