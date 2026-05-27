CREATE TYPE "MemberPublicRecordType" AS ENUM (
  'REPORT_ACTIVITY',
  'COMMUNITY_SERVICE',
  'TRAINING_CONDUCTED',
  'PARTICIPATION',
  'RECOGNITION'
);

CREATE TYPE "MemberPublicRecordStatus" AS ENUM (
  'PUBLISHED',
  'DRAFT'
);

CREATE TABLE "MemberPublicRecord" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "shortDescription" TEXT NOT NULL,
  "type" "MemberPublicRecordType" NOT NULL,
  "eventAt" TIMESTAMP(3) NOT NULL,
  "location" TEXT NOT NULL,
  "status" "MemberPublicRecordStatus" NOT NULL DEFAULT 'PUBLISHED',
  "memberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MemberPublicRecord_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberPublicRecord_memberId_eventAt_idx" ON "MemberPublicRecord"("memberId", "eventAt");
CREATE INDEX "MemberPublicRecord_type_idx" ON "MemberPublicRecord"("type");
CREATE INDEX "MemberPublicRecord_status_idx" ON "MemberPublicRecord"("status");

ALTER TABLE "MemberPublicRecord"
ADD CONSTRAINT "MemberPublicRecord_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
