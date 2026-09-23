CREATE TABLE "ChaplainServiceAvailability" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "startsAt" TIMESTAMP(3) NOT NULL,
  "endsAt" TIMESTAMP(3) NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChaplainServiceAvailability_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChaplainServiceAvailability"
ADD CONSTRAINT "ChaplainServiceAvailability_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX "ChaplainServiceAvailability_memberId_startsAt_endsAt_key"
ON "ChaplainServiceAvailability"("memberId", "startsAt", "endsAt");
CREATE INDEX "ChaplainServiceAvailability_memberId_startsAt_idx"
ON "ChaplainServiceAvailability"("memberId", "startsAt");
CREATE INDEX "ChaplainServiceAvailability_startsAt_endsAt_idx"
ON "ChaplainServiceAvailability"("startsAt", "endsAt");
