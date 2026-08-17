CREATE TYPE "SeminaryAssignmentStatus" AS ENUM ('PUBLISHED', 'DRAFT', 'SCHEDULED');

CREATE TYPE "SeminaryStudentNotificationType" AS ENUM ('ASSIGNMENT');

CREATE TABLE "SeminaryAssignment" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "subject" TEXT NOT NULL,
  "courseId" TEXT,
  "courseName" TEXT,
  "courseCode" TEXT,
  "instructorUserId" TEXT,
  "instructorName" TEXT NOT NULL,
  "assignmentType" TEXT NOT NULL,
  "dueAt" TIMESTAMP(3) NOT NULL,
  "status" "SeminaryAssignmentStatus" NOT NULL DEFAULT 'DRAFT',
  "totalMarks" INTEGER NOT NULL,
  "additionalInstructions" TEXT,
  "allowLateSubmission" BOOLEAN NOT NULL DEFAULT true,
  "lateSubmissionDeadline" TIMESTAMP(3),
  "notifyStudents" BOOLEAN NOT NULL DEFAULT true,
  "attachmentLabel" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeminaryStudentNotification" (
  "id" TEXT NOT NULL,
  "studentApplicationId" TEXT,
  "studentId" TEXT,
  "studentName" TEXT NOT NULL,
  "studentEmail" TEXT,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "type" "SeminaryStudentNotificationType" NOT NULL,
  "assignmentId" TEXT,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "SeminaryStudentNotification_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeminaryAssignment_subject_idx" ON "SeminaryAssignment"("subject");
CREATE INDEX "SeminaryAssignment_courseId_idx" ON "SeminaryAssignment"("courseId");
CREATE INDEX "SeminaryAssignment_instructorUserId_idx" ON "SeminaryAssignment"("instructorUserId");
CREATE INDEX "SeminaryAssignment_status_idx" ON "SeminaryAssignment"("status");
CREATE INDEX "SeminaryAssignment_dueAt_idx" ON "SeminaryAssignment"("dueAt");
CREATE INDEX "SeminaryStudentNotification_studentApplicationId_idx" ON "SeminaryStudentNotification"("studentApplicationId");
CREATE INDEX "SeminaryStudentNotification_studentId_idx" ON "SeminaryStudentNotification"("studentId");
CREATE INDEX "SeminaryStudentNotification_type_idx" ON "SeminaryStudentNotification"("type");
CREATE INDEX "SeminaryStudentNotification_assignmentId_idx" ON "SeminaryStudentNotification"("assignmentId");
CREATE INDEX "SeminaryStudentNotification_readAt_idx" ON "SeminaryStudentNotification"("readAt");
CREATE INDEX "SeminaryStudentNotification_createdAt_idx" ON "SeminaryStudentNotification"("createdAt");
