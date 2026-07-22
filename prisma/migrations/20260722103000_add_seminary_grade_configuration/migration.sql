CREATE TABLE "SeminaryGradeConfiguration" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "passingEquivalent" TEXT NOT NULL DEFAULT '2.50',
  "releaseWindow" TEXT NOT NULL DEFAULT 'After dean confirmation',
  "weightProfile" TEXT NOT NULL DEFAULT 'Standard Coursework',
  "completionWindowDays" INTEGER NOT NULL DEFAULT 30,
  "approvalWorkflow" BOOLEAN NOT NULL DEFAULT true,
  "allowFacultyOverride" BOOLEAN NOT NULL DEFAULT true,
  "autoPublishApproved" BOOLEAN NOT NULL DEFAULT false,
  "showConditionalRemark" BOOLEAN NOT NULL DEFAULT true,
  "gradeScale" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryGradeConfiguration_pkey" PRIMARY KEY ("id")
);
