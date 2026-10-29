CREATE TYPE "ReferralPointEntryStatus" AS ENUM ('EARNED', 'REVERSED', 'VOID');

ALTER TABLE "Member"
  ADD COLUMN "referralCode" TEXT,
  ADD COLUMN "referralCodeCreatedAt" TIMESTAMP(3),
  ADD COLUMN "referredByMemberId" TEXT;

CREATE UNIQUE INDEX "Member_referralCode_key" ON "Member"("referralCode");
CREATE INDEX "Member_referredByMemberId_idx" ON "Member"("referredByMemberId");
ALTER TABLE "Member" ADD CONSTRAINT "Member_referredByMemberId_fkey"
  FOREIGN KEY ("referredByMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "ReferralPointCriterion" (
  "id" TEXT NOT NULL,
  "key" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "description" TEXT,
  "points" INTEGER NOT NULL,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "oncePerReferred" BOOLEAN NOT NULL DEFAULT true,
  "monthlyCap" INTEGER,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferralPointCriterion_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferralPointCriterion_key_key" ON "ReferralPointCriterion"("key");
CREATE INDEX "ReferralPointCriterion_isActive_sortOrder_idx" ON "ReferralPointCriterion"("isActive", "sortOrder");

CREATE TABLE "ReferralPointLedgerEntry" (
  "id" TEXT NOT NULL,
  "referrerMemberId" TEXT NOT NULL,
  "referredMemberId" TEXT NOT NULL,
  "criterionId" TEXT NOT NULL,
  "points" INTEGER NOT NULL,
  "occurredAt" TIMESTAMP(3) NOT NULL,
  "periodKey" TEXT NOT NULL,
  "sourceType" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "status" "ReferralPointEntryStatus" NOT NULL DEFAULT 'EARNED',
  "note" TEXT,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ReferralPointLedgerEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferralPointLedgerEntry_criterionId_referredMemberId_sourceType_sourceId_key" ON "ReferralPointLedgerEntry"("criterionId", "referredMemberId", "sourceType", "sourceId");
CREATE INDEX "ReferralPointLedgerEntry_referrerMemberId_periodKey_status_idx" ON "ReferralPointLedgerEntry"("referrerMemberId", "periodKey", "status");
CREATE INDEX "ReferralPointLedgerEntry_referredMemberId_idx" ON "ReferralPointLedgerEntry"("referredMemberId");
CREATE INDEX "ReferralPointLedgerEntry_periodKey_status_idx" ON "ReferralPointLedgerEntry"("periodKey", "status");
ALTER TABLE "ReferralPointLedgerEntry" ADD CONSTRAINT "ReferralPointLedgerEntry_referrerMemberId_fkey" FOREIGN KEY ("referrerMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralPointLedgerEntry" ADD CONSTRAINT "ReferralPointLedgerEntry_referredMemberId_fkey" FOREIGN KEY ("referredMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ReferralPointLedgerEntry" ADD CONSTRAINT "ReferralPointLedgerEntry_criterionId_fkey" FOREIGN KEY ("criterionId") REFERENCES "ReferralPointCriterion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "ReferralRecognitionPeriod" (
  "id" TEXT NOT NULL,
  "periodKey" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "isLocked" BOOLEAN NOT NULL DEFAULT false,
  "lockedAt" TIMESTAMP(3),
  "lockedByUserId" TEXT,
  "winners" JSONB NOT NULL DEFAULT '[]',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ReferralRecognitionPeriod_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ReferralRecognitionPeriod_periodKey_key" ON "ReferralRecognitionPeriod"("periodKey");

INSERT INTO "ReferralPointCriterion" ("id", "key", "label", "description", "points", "sortOrder", "updatedAt") VALUES
  ('a4f6d4c2-8ae0-4d3f-a4ba-000000000001', 'APPLICATION_SUBMITTED', 'Membership application submitted', 'A referred applicant successfully submits a membership application.', 3, 1, CURRENT_TIMESTAMP),
  ('a4f6d4c2-8ae0-4d3f-a4ba-000000000002', 'MEMBER_APPROVED', 'Referred member approved', 'The referred applicant is approved as an active member.', 5, 2, CURRENT_TIMESTAMP)
ON CONFLICT ("key") DO NOTHING;
