-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "profilepictureid" TEXT,
    "roleid" TEXT,
    "isbanned" BOOLEAN NOT NULL DEFAULT false,
    "coinbalance" INTEGER NOT NULL DEFAULT 0,
    "ispremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumexpiresat" TIMESTAMP(3),
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayname" TEXT NOT NULL,
    "description" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "permission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rolepermission" (
    "id" TEXT NOT NULL,
    "roleid" TEXT NOT NULL,
    "permissionid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rolepermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videofileid" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "duration" INTEGER,
    "viewcount" INTEGER NOT NULL DEFAULT 0,
    "likecount" INTEGER NOT NULL DEFAULT 0,
    "commentcount" INTEGER NOT NULL DEFAULT 0,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "like" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "like_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "follow" (
    "id" TEXT NOT NULL,
    "followerid" TEXT NOT NULL,
    "followingid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "relateduserid" TEXT,
    "videoid" TEXT,
    "commentid" TEXT,
    "isread" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "filesize" BIGINT NOT NULL,
    "cloud_storage_path" TEXT NOT NULL,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gifttype" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "displayname" TEXT NOT NULL,
    "coinvalue" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gifttype_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gift" (
    "id" TEXT NOT NULL,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT NOT NULL,
    "gifttypeid" TEXT NOT NULL,
    "videoid" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gift_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balancebefore" INTEGER NOT NULL,
    "balanceafter" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enddate" TIMESTAMP(3) NOT NULL,
    "autorenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentid" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "earning" (
    "id" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidout" BOOLEAN NOT NULL DEFAULT false,
    "paidoutat" TIMESTAMP(3),
    "metadata" TEXT,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "earning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL,
    "reporterid" TEXT NOT NULL,
    "reportedtype" TEXT NOT NULL,
    "reporteduserid" TEXT,
    "reportedvideoid" TEXT,
    "reportedcommentid" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedby" TEXT,
    "resolvedat" TIMESTAMP(3),
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hashtag" (
    "id" TEXT NOT NULL,
    "tag" TEXT NOT NULL,
    "usecount" INTEGER NOT NULL DEFAULT 0,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hashtag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "videohashtag" (
    "videoid" TEXT NOT NULL,
    "hashtagid" TEXT NOT NULL,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "videohashtag_pkey" PRIMARY KEY ("videoid","hashtagid")
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isread" BOOLEAN NOT NULL DEFAULT false,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_username_key" ON "user"("username");

-- CreateIndex
CREATE UNIQUE INDEX "role_name_key" ON "role"("name");

-- CreateIndex
CREATE INDEX "role_name_idx" ON "role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permission_name_key" ON "permission"("name");

-- CreateIndex
CREATE INDEX "permission_category_idx" ON "permission"("category");

-- CreateIndex
CREATE INDEX "permission_name_idx" ON "permission"("name");

-- CreateIndex
CREATE INDEX "rolepermission_roleid_idx" ON "rolepermission"("roleid");

-- CreateIndex
CREATE INDEX "rolepermission_permissionid_idx" ON "rolepermission"("permissionid");

-- CreateIndex
CREATE UNIQUE INDEX "rolepermission_roleid_permissionid_key" ON "rolepermission"("roleid", "permissionid");

-- CreateIndex
CREATE INDEX "like_videoid_idx" ON "like"("videoid");

-- CreateIndex
CREATE INDEX "like_userid_idx" ON "like"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "like_userid_videoid_key" ON "like"("userid", "videoid");

-- CreateIndex
CREATE INDEX "comment_videoid_idx" ON "comment"("videoid");

-- CreateIndex
CREATE INDEX "comment_userid_idx" ON "comment"("userid");

-- CreateIndex
CREATE INDEX "follow_followerid_idx" ON "follow"("followerid");

-- CreateIndex
CREATE INDEX "follow_followingid_idx" ON "follow"("followingid");

-- CreateIndex
CREATE UNIQUE INDEX "follow_followerid_followingid_key" ON "follow"("followerid", "followingid");

-- CreateIndex
CREATE INDEX "notification_userid_idx" ON "notification"("userid");

-- CreateIndex
CREATE INDEX "notification_isread_idx" ON "notification"("isread");

-- CreateIndex
CREATE UNIQUE INDEX "gifttype_name_key" ON "gifttype"("name");

-- CreateIndex
CREATE INDEX "gifttype_name_idx" ON "gifttype"("name");

-- CreateIndex
CREATE INDEX "gift_senderid_idx" ON "gift"("senderid");

-- CreateIndex
CREATE INDEX "gift_receiverid_idx" ON "gift"("receiverid");

-- CreateIndex
CREATE INDEX "gift_videoid_idx" ON "gift"("videoid");

-- CreateIndex
CREATE INDEX "transaction_userid_idx" ON "transaction"("userid");

-- CreateIndex
CREATE INDEX "transaction_type_idx" ON "transaction"("type");

-- CreateIndex
CREATE INDEX "subscription_userid_idx" ON "subscription"("userid");

-- CreateIndex
CREATE INDEX "subscription_status_idx" ON "subscription"("status");

-- CreateIndex
CREATE INDEX "earning_userid_idx" ON "earning"("userid");

-- CreateIndex
CREATE INDEX "earning_status_idx" ON "earning"("status");

-- CreateIndex
CREATE INDEX "earning_paidout_idx" ON "earning"("paidout");

-- CreateIndex
CREATE INDEX "report_reporterid_idx" ON "report"("reporterid");

-- CreateIndex
CREATE INDEX "report_reportedtype_idx" ON "report"("reportedtype");

-- CreateIndex
CREATE INDEX "report_status_idx" ON "report"("status");

-- CreateIndex
CREATE UNIQUE INDEX "hashtag_tag_key" ON "hashtag"("tag");

-- CreateIndex
CREATE INDEX "hashtag_tag_idx" ON "hashtag"("tag");

-- CreateIndex
CREATE INDEX "hashtag_usecount_idx" ON "hashtag"("usecount");

-- CreateIndex
CREATE INDEX "videohashtag_videoid_idx" ON "videohashtag"("videoid");

-- CreateIndex
CREATE INDEX "videohashtag_hashtagid_idx" ON "videohashtag"("hashtagid");

-- CreateIndex
CREATE INDEX "message_senderid_idx" ON "message"("senderid");

-- CreateIndex
CREATE INDEX "message_receiverid_idx" ON "message"("receiverid");

-- CreateIndex
CREATE INDEX "message_senderid_receiverid_idx" ON "message"("senderid", "receiverid");

-- CreateIndex
CREATE INDEX "message_createdat_idx" ON "message"("createdat");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "role"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_profilepictureid_fkey" FOREIGN KEY ("profilepictureid") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rolepermission" ADD CONSTRAINT "rolepermission_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rolepermission" ADD CONSTRAINT "rolepermission_permissionid_fkey" FOREIGN KEY ("permissionid") REFERENCES "permission"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_videofileid_fkey" FOREIGN KEY ("videofileid") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "video" ADD CONSTRAINT "video_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "like" ADD CONSTRAINT "like_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comment" ADD CONSTRAINT "comment_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followerid_fkey" FOREIGN KEY ("followerid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "follow" ADD CONSTRAINT "follow_followingid_fkey" FOREIGN KEY ("followingid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_relateduserid_fkey" FOREIGN KEY ("relateduserid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification" ADD CONSTRAINT "notification_commentid_fkey" FOREIGN KEY ("commentid") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_gifttypeid_fkey" FOREIGN KEY ("gifttypeid") REFERENCES "gifttype"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "gift" ADD CONSTRAINT "gift_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transaction" ADD CONSTRAINT "transaction_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription" ADD CONSTRAINT "subscription_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "earning" ADD CONSTRAINT "earning_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporterid_fkey" FOREIGN KEY ("reporterid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reporteduserid_fkey" FOREIGN KEY ("reporteduserid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reportedvideoid_fkey" FOREIGN KEY ("reportedvideoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report" ADD CONSTRAINT "report_reportedcommentid_fkey" FOREIGN KEY ("reportedcommentid") REFERENCES "comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videohashtag" ADD CONSTRAINT "videohashtag_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "videohashtag" ADD CONSTRAINT "videohashtag_hashtagid_fkey" FOREIGN KEY ("hashtagid") REFERENCES "hashtag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "message" ADD CONSTRAINT "message_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
