-- CreateEnum
CREATE TYPE "SeminaryGradeRecordStatus" AS ENUM ('COMPLETE', 'PENDING_REVIEW', 'IN_PROGRESS', 'INCOMPLETE');

-- CreateEnum
CREATE TYPE "SeminaryGradeRecordRemark" AS ENUM ('PASSED', 'CONDITIONAL', 'FAILED', 'ONGOING');

-- CreateTable
CREATE TABLE "SeminaryGradeRecord" (
    "id" TEXT NOT NULL,
    "recordNumber" TEXT NOT NULL,
    "studentApplicationId" TEXT,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "programLevel" "SeminaryProgramLevel",
    "subject" TEXT NOT NULL,
    "courseId" TEXT,
    "courseTitle" TEXT NOT NULL,
    "courseCode" TEXT NOT NULL,
    "instructorUserId" TEXT,
    "instructorName" TEXT NOT NULL,
    "term" TEXT NOT NULL,
    "finalGrade" TEXT NOT NULL,
    "remarks" "SeminaryGradeRecordRemark" NOT NULL DEFAULT 'ONGOING',
    "status" "SeminaryGradeRecordStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryGradeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryGradeRecord_recordNumber_key" ON "SeminaryGradeRecord"("recordNumber");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_studentApplicationId_idx" ON "SeminaryGradeRecord"("studentApplicationId");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_studentId_idx" ON "SeminaryGradeRecord"("studentId");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_programLevel_idx" ON "SeminaryGradeRecord"("programLevel");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_subject_idx" ON "SeminaryGradeRecord"("subject");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_courseId_idx" ON "SeminaryGradeRecord"("courseId");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_instructorUserId_idx" ON "SeminaryGradeRecord"("instructorUserId");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_status_idx" ON "SeminaryGradeRecord"("status");

-- CreateIndex
CREATE INDEX "SeminaryGradeRecord_term_idx" ON "SeminaryGradeRecord"("term");
