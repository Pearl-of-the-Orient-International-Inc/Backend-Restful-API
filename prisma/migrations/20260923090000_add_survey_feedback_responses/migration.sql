CREATE TABLE "SurveyFeedbackResponse" (
  "id" TEXT NOT NULL,
  "respondentName" TEXT,
  "respondentType" TEXT NOT NULL,
  "discoverySource" TEXT NOT NULL,
  "improvementAreas" TEXT[] NOT NULL,
  "welcomeRating" INTEGER NOT NULL,
  "accessibilityRating" INTEGER NOT NULL,
  "satisfactionRating" INTEGER NOT NULL,
  "feedback" TEXT NOT NULL,
  "hasIssue" BOOLEAN NOT NULL DEFAULT false,
  "issueCategory" TEXT,
  "issueDescription" TEXT,
  "contactEmail" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SurveyFeedbackResponse_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SurveyFeedbackResponse_createdAt_idx" ON "SurveyFeedbackResponse"("createdAt");
CREATE INDEX "SurveyFeedbackResponse_hasIssue_idx" ON "SurveyFeedbackResponse"("hasIssue");
CREATE INDEX "SurveyFeedbackResponse_respondentType_idx" ON "SurveyFeedbackResponse"("respondentType");
