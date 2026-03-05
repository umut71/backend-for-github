-- CreateTable
CREATE TABLE "referral" (
    "id" TEXT NOT NULL,
    "referrerid" TEXT NOT NULL,
    "referredid" TEXT,
    "code" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "reward" INTEGER NOT NULL DEFAULT 100,
    "createdat" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedat" TIMESTAMP(3),

    CONSTRAINT "referral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "referral_code_key" ON "referral"("code");

-- CreateIndex
CREATE INDEX "referral_referrerid_idx" ON "referral"("referrerid");

-- CreateIndex
CREATE INDEX "referral_code_idx" ON "referral"("code");

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referrerid_fkey" FOREIGN KEY ("referrerid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referral" ADD CONSTRAINT "referral_referredid_fkey" FOREIGN KEY ("referredid") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
