-- Add the administration review trail for CRASM applications.
ALTER TABLE "CrasmApplication" ADD COLUMN "adminNotes" TEXT;

CREATE TABLE "CrasmApplicationReview" (
    "id" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "action" "OrdinationReviewAction" NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrasmApplicationReview_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CrasmApplicationReview_applicationId_idx" ON "CrasmApplicationReview"("applicationId");
CREATE INDEX "CrasmApplicationReview_reviewerId_idx" ON "CrasmApplicationReview"("reviewerId");

ALTER TABLE "CrasmApplicationReview" ADD CONSTRAINT "CrasmApplicationReview_applicationId_fkey"
  FOREIGN KEY ("applicationId") REFERENCES "CrasmApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CrasmApplicationReview" ADD CONSTRAINT "CrasmApplicationReview_reviewerId_fkey"
  FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
