CREATE TYPE "SeminaryAcademicYearSession" AS ENUM ('CURRENT', 'PREVIOUS', 'UPCOMING');

CREATE TYPE "SeminaryAcademicYearStatus" AS ENUM ('ACTIVE', 'UPCOMING', 'COMPLETED');

CREATE TABLE "SeminaryAcademicYear" (
  "id" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "session" "SeminaryAcademicYearSession" NOT NULL,
  "status" "SeminaryAcademicYearStatus" NOT NULL,
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryAcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeminaryAcademicYear_academicYear_key" ON "SeminaryAcademicYear"("academicYear");
CREATE INDEX "SeminaryAcademicYear_session_idx" ON "SeminaryAcademicYear"("session");
CREATE INDEX "SeminaryAcademicYear_status_idx" ON "SeminaryAcademicYear"("status");
CREATE INDEX "SeminaryAcademicYear_startDate_idx" ON "SeminaryAcademicYear"("startDate");
CREATE INDEX "SeminaryAcademicYear_sortOrder_idx" ON "SeminaryAcademicYear"("sortOrder");
