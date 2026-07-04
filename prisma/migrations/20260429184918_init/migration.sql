-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "bio" TEXT,
    "profilepictureid" TEXT,
    "roleid" TEXT,
    "isbanned" BOOLEAN NOT NULL DEFAULT false,
    "coinbalance" INTEGER NOT NULL DEFAULT 0,
    "ispremium" BOOLEAN NOT NULL DEFAULT false,
    "premiumexpiresat" DATETIME,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL,
    CONSTRAINT "user_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "role" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "user_profilepictureid_fkey" FOREIGN KEY ("profilepictureid") REFERENCES "file" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayname" TEXT NOT NULL,
    "description" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "permission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "rolepermission" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "roleid" TEXT NOT NULL,
    "permissionid" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "rolepermission_roleid_fkey" FOREIGN KEY ("roleid") REFERENCES "role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "rolepermission_permissionid_fkey" FOREIGN KEY ("permissionid") REFERENCES "permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "video" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "videofileid" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "duration" INTEGER,
    "viewcount" INTEGER NOT NULL DEFAULT 0,
    "likecount" INTEGER NOT NULL DEFAULT 0,
    "commentcount" INTEGER NOT NULL DEFAULT 0,
    "isduet" BOOLEAN NOT NULL DEFAULT false,
    "originalvideoid" TEXT,
    "soundid" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL,
    CONSTRAINT "video_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "video_videofileid_fkey" FOREIGN KEY ("videofileid") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "video_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "video_originalvideoid_fkey" FOREIGN KEY ("originalvideoid") REFERENCES "video" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "video_soundid_fkey" FOREIGN KEY ("soundid") REFERENCES "sound" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "like" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "like_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "like_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL,
    CONSTRAINT "comment_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "comment_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "follow" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "followerid" TEXT NOT NULL,
    "followingid" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "follow_followerid_fkey" FOREIGN KEY ("followerid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "follow_followingid_fkey" FOREIGN KEY ("followingid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT,
    "relateduserid" TEXT,
    "videoid" TEXT,
    "commentid" TEXT,
    "isread" BOOLEAN NOT NULL DEFAULT false,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notification_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_relateduserid_fkey" FOREIGN KEY ("relateduserid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "notification_commentid_fkey" FOREIGN KEY ("commentid") REFERENCES "comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "file" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "mimetype" TEXT NOT NULL,
    "filesize" BIGINT NOT NULL,
    "cloud_storage_path" TEXT NOT NULL,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gifttype" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "displayname" TEXT NOT NULL,
    "coinvalue" INTEGER NOT NULL,
    "emoji" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "gift" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT NOT NULL,
    "gifttypeid" TEXT NOT NULL,
    "videoid" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "gift_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_gifttypeid_fkey" FOREIGN KEY ("gifttypeid") REFERENCES "gifttype" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "gift_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "transaction" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balancebefore" INTEGER NOT NULL,
    "balanceafter" INTEGER NOT NULL,
    "description" TEXT,
    "metadata" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "transaction_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "subscription" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "plan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startdate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "enddate" DATETIME NOT NULL,
    "autorenew" BOOLEAN NOT NULL DEFAULT true,
    "paymentid" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL,
    CONSTRAINT "subscription_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "earning" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "paidout" BOOLEAN NOT NULL DEFAULT false,
    "paidoutat" DATETIME,
    "metadata" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "earning_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "report" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "reporterid" TEXT NOT NULL,
    "reportedtype" TEXT NOT NULL,
    "reporteduserid" TEXT,
    "reportedvideoid" TEXT,
    "reportedcommentid" TEXT,
    "reason" TEXT NOT NULL,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "resolvedby" TEXT,
    "resolvedat" DATETIME,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "report_reporterid_fkey" FOREIGN KEY ("reporterid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_reporteduserid_fkey" FOREIGN KEY ("reporteduserid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_reportedvideoid_fkey" FOREIGN KEY ("reportedvideoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "report_reportedcommentid_fkey" FOREIGN KEY ("reportedcommentid") REFERENCES "comment" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "hashtag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tag" TEXT NOT NULL,
    "usecount" INTEGER NOT NULL DEFAULT 0,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "videohashtag" (
    "videoid" TEXT NOT NULL,
    "hashtagid" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY ("videoid", "hashtagid"),
    CONSTRAINT "videohashtag_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "videohashtag_hashtagid_fkey" FOREIGN KEY ("hashtagid") REFERENCES "hashtag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "message" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "senderid" TEXT NOT NULL,
    "receiverid" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isread" BOOLEAN NOT NULL DEFAULT false,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedat" DATETIME NOT NULL,
    CONSTRAINT "message_senderid_fkey" FOREIGN KEY ("senderid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "message_receiverid_fkey" FOREIGN KEY ("receiverid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "story" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "videofileid" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresat" DATETIME NOT NULL,
    "viewcount" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "story_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "story_videofileid_fkey" FOREIGN KEY ("videofileid") REFERENCES "file" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "story_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storyview" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyid" TEXT NOT NULL,
    "viewerid" TEXT NOT NULL,
    "viewedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storyview_storyid_fkey" FOREIGN KEY ("storyid") REFERENCES "story" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "storyview_viewerid_fkey" FOREIGN KEY ("viewerid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestream" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "thumbnailfileid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'live',
    "viewercount" INTEGER NOT NULL DEFAULT 0,
    "peakviewers" INTEGER NOT NULL DEFAULT 0,
    "streamkey" TEXT NOT NULL,
    "channelname" TEXT NOT NULL,
    "starttime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endtime" DATETIME,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "livestream_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestream_thumbnailfileid_fkey" FOREIGN KEY ("thumbnailfileid") REFERENCES "file" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "livestreamviewer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "livestreamid" TEXT NOT NULL,
    "viewerid" TEXT NOT NULL,
    "jointime" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "livestreamviewer_livestreamid_fkey" FOREIGN KEY ("livestreamid") REFERENCES "livestream" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "livestreamviewer_viewerid_fkey" FOREIGN KEY ("viewerid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sound" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jamendoid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "artist" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "audiourl" TEXT NOT NULL,
    "imageurl" TEXT,
    "popularity" INTEGER NOT NULL DEFAULT 0,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "challenge" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hashtag" TEXT NOT NULL,
    "startdate" DATETIME NOT NULL,
    "enddate" DATETIME NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "watchhistory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "watchedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "watchhistory_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "watchhistory_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "savedvideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "savedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "savedvideo_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "savedvideo_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "playlist" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ispublic" BOOLEAN NOT NULL DEFAULT true,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "playlist_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "playlistvideo" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "playlistid" TEXT NOT NULL,
    "videoid" TEXT NOT NULL,
    "addedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "playlistvideo_playlistid_fkey" FOREIGN KEY ("playlistid") REFERENCES "playlist" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "playlistvideo_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "blockeduser" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userid" TEXT NOT NULL,
    "blockedid" TEXT NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "blockeduser_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "blockeduser_blockedid_fkey" FOREIGN KEY ("blockedid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "sharecount" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoid" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "sharecount_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "referral" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "referrerid" TEXT NOT NULL,
    "referredid" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reward" INTEGER NOT NULL DEFAULT 100,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedat" DATETIME,
    CONSTRAINT "referral_referrerid_fkey" FOREIGN KEY ("referrerid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "referral_referredid_fkey" FOREIGN KEY ("referredid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "voicecomment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "videoid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "audiourl" TEXT NOT NULL,
    "duration" INTEGER NOT NULL,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "voicecomment_videoid_fkey" FOREIGN KEY ("videoid") REFERENCES "video" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "voicecomment_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storypoll" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "storyid" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "option1" TEXT NOT NULL,
    "option2" TEXT NOT NULL,
    "votes1" INTEGER NOT NULL DEFAULT 0,
    "votes2" INTEGER NOT NULL DEFAULT 0,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storypoll_storyid_fkey" FOREIGN KEY ("storyid") REFERENCES "story" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "storypollvote" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "pollid" TEXT NOT NULL,
    "userid" TEXT NOT NULL,
    "option" INTEGER NOT NULL,
    "votedat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "storypollvote_pollid_fkey" FOREIGN KEY ("pollid") REFERENCES "storypoll" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "storypollvote_userid_fkey" FOREIGN KEY ("userid") REFERENCES "user" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "errorlog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "statusCode" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stack" TEXT,
    "userAgent" TEXT,
    "ip" TEXT,
    "userId" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "createdat" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedat" DATETIME
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
CREATE INDEX "video_originalvideoid_idx" ON "video"("originalvideoid");

-- CreateIndex
CREATE INDEX "video_isduet_idx" ON "video"("isduet");

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

-- CreateIndex
CREATE UNIQUE INDEX "sound_jamendoid_key" ON "sound"("jamendoid");

-- CreateIndex
CREATE INDEX "sound_popularity_idx" ON "sound"("popularity");

-- CreateIndex
CREATE INDEX "sound_jamendoid_idx" ON "sound"("jamendoid");

-- CreateIndex
CREATE INDEX "challenge_hashtag_idx" ON "challenge"("hashtag");

-- CreateIndex
CREATE INDEX "challenge_enddate_idx" ON "challenge"("enddate");

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

-- CreateIndex
CREATE INDEX "playlist_userid_idx" ON "playlist"("userid");

-- CreateIndex
CREATE INDEX "playlistvideo_playlistid_idx" ON "playlistvideo"("playlistid");

-- CreateIndex
CREATE UNIQUE INDEX "playlistvideo_playlistid_videoid_key" ON "playlistvideo"("playlistid", "videoid");

-- CreateIndex
CREATE INDEX "blockeduser_userid_idx" ON "blockeduser"("userid");

-- CreateIndex
CREATE UNIQUE INDEX "blockeduser_userid_blockedid_key" ON "blockeduser"("userid", "blockedid");

-- CreateIndex
CREATE INDEX "sharecount_videoid_idx" ON "sharecount"("videoid");

-- CreateIndex
CREATE UNIQUE INDEX "sharecount_videoid_platform_key" ON "sharecount"("videoid", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_key" ON "referral"("code");

-- CreateIndex
CREATE INDEX "referral_referrerid_idx" ON "referral"("referrerid");

-- CreateIndex
CREATE INDEX "referral_code_idx" ON "referral"("code");

-- CreateIndex
CREATE INDEX "voicecomment_videoid_idx" ON "voicecomment"("videoid");

-- CreateIndex
CREATE INDEX "voicecomment_userid_idx" ON "voicecomment"("userid");

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

-- CreateIndex
CREATE INDEX "errorlog_resolved_idx" ON "errorlog"("resolved");

-- CreateIndex
CREATE INDEX "errorlog_statusCode_idx" ON "errorlog"("statusCode");

-- CreateIndex
CREATE INDEX "errorlog_createdat_idx" ON "errorlog"("createdat");

-- CreateIndex
CREATE INDEX "errorlog_path_idx" ON "errorlog"("path");
