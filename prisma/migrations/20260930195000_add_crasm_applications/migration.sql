CREATE TABLE "CrasmApplication" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "status" "OrdinationApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "appointmentTitle" TEXT NOT NULL,
  "appointingOfficer" TEXT NOT NULL,
  "recommendingOfficer" TEXT NOT NULL,
  "territorialJurisdiction" TEXT NOT NULL,
  "churchName" TEXT NOT NULL,
  "churchAddress" TEXT NOT NULL,
  "documents" JSONB NOT NULL,
  "informationAccurate" BOOLEAN NOT NULL DEFAULT false,
  "backgroundCheckConsent" BOOLEAN NOT NULL DEFAULT false,
  "requestedInformation" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CrasmApplication_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CrasmApplication_memberId_key" ON "CrasmApplication"("memberId");
CREATE INDEX "CrasmApplication_status_idx" ON "CrasmApplication"("status");
CREATE INDEX "CrasmApplication_submittedAt_idx" ON "CrasmApplication"("submittedAt");
ALTER TABLE "CrasmApplication" ADD CONSTRAINT "CrasmApplication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
