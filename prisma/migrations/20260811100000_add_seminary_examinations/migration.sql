-- CreateEnum
CREATE TYPE "SeminaryExaminationStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'DRAFT');

-- CreateTable
CREATE TABLE "SeminaryExamination" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "coverage" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT,
    "courseCode" TEXT,
    "instructorUserId" TEXT,
    "instructorName" TEXT NOT NULL,
    "examType" TEXT NOT NULL,
    "scheduledAt" TIMESTAMP(3) NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "status" "SeminaryExaminationStatus" NOT NULL DEFAULT 'DRAFT',
    "totalPoints" INTEGER NOT NULL,
    "passingScore" INTEGER NOT NULL,
    "instructions" TEXT,
    "randomizeQuestions" BOOLEAN NOT NULL DEFAULT false,
    "showResults" BOOLEAN NOT NULL DEFAULT true,
    "questions" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryExamination_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SeminaryExamination_subject_idx" ON "SeminaryExamination"("subject");

-- CreateIndex
CREATE INDEX "SeminaryExamination_courseId_idx" ON "SeminaryExamination"("courseId");

-- CreateIndex
CREATE INDEX "SeminaryExamination_instructorUserId_idx" ON "SeminaryExamination"("instructorUserId");

-- CreateIndex
CREATE INDEX "SeminaryExamination_status_idx" ON "SeminaryExamination"("status");

-- CreateIndex
CREATE INDEX "SeminaryExamination_scheduledAt_idx" ON "SeminaryExamination"("scheduledAt");
