CREATE TYPE "OrdinationApplicationStatus" AS ENUM ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ADDITIONAL_INFORMATION_REQUIRED', 'RETURNED_FOR_CORRECTION', 'APPROVED', 'REJECTED');
CREATE TYPE "OrdinationEligibilityBasis" AS ENUM ('PROFESSIONAL_CHAPLAIN', 'SEMINARY_GRADUATE');
CREATE TYPE "OrdinationReviewAction" AS ENUM ('START_REVIEW', 'REQUEST_ADDITIONAL_INFORMATION', 'RETURN_FOR_CORRECTION', 'APPROVE', 'REJECT');

CREATE TABLE "OrdinationApplication" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "status" "OrdinationApplicationStatus" NOT NULL DEFAULT 'DRAFT',
  "eligibilityBasis" "OrdinationEligibilityBasis" NOT NULL DEFAULT 'PROFESSIONAL_CHAPLAIN',
  "eligibilityMemberType" "MemberType" NOT NULL,
  "ministryBackground" TEXT NOT NULL,
  "callingStatement" TEXT NOT NULL,
  "proposedMinistry" TEXT NOT NULL,
  "additionalInformation" TEXT,
  "documents" JSONB NOT NULL,
  "informationAccurate" BOOLEAN NOT NULL DEFAULT false,
  "codeOfConductAccepted" BOOLEAN NOT NULL DEFAULT false,
  "backgroundCheckConsent" BOOLEAN NOT NULL DEFAULT false,
  "requestedInformation" TEXT,
  "adminNotes" TEXT,
  "submittedAt" TIMESTAMP(3),
  "reviewedAt" TIMESTAMP(3),
  "decidedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "OrdinationApplication_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "OrdinationApplicationReview" (
  "id" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "action" "OrdinationReviewAction" NOT NULL,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrdinationApplicationReview_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "OrdinationApplication_memberId_key" ON "OrdinationApplication"("memberId");
CREATE INDEX "OrdinationApplication_status_idx" ON "OrdinationApplication"("status");
CREATE INDEX "OrdinationApplication_submittedAt_idx" ON "OrdinationApplication"("submittedAt");
CREATE INDEX "OrdinationApplicationReview_applicationId_idx" ON "OrdinationApplicationReview"("applicationId");
CREATE INDEX "OrdinationApplicationReview_reviewerId_idx" ON "OrdinationApplicationReview"("reviewerId");
ALTER TABLE "OrdinationApplication" ADD CONSTRAINT "OrdinationApplication_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdinationApplicationReview" ADD CONSTRAINT "OrdinationApplicationReview_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "OrdinationApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrdinationApplicationReview" ADD CONSTRAINT "OrdinationApplicationReview_reviewerId_fkey" FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
