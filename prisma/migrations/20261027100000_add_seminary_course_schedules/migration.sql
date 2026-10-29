CREATE TYPE "SeminaryCourseScheduleStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'CANCELLED', 'COMPLETED');

CREATE TABLE "SeminaryCourseSchedule" (
    "id" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "academicYear" TEXT NOT NULL,
    "className" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,
    "scheduledDate" TIMESTAMP(3),
    "recurrenceDays" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "recurrenceEndDate" TIMESTAMP(3),
    "startTime" TEXT NOT NULL,
    "endTime" TEXT NOT NULL,
    "deliveryMode" "SeminaryCourseModality" NOT NULL,
    "location" TEXT,
    "meetingLink" TEXT,
    "status" "SeminaryCourseScheduleStatus" NOT NULL DEFAULT 'SCHEDULED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryCourseSchedule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeminaryCourseSchedule_academicYear_className_section_idx" ON "SeminaryCourseSchedule"("academicYear", "className", "section");
CREATE INDEX "SeminaryCourseSchedule_courseId_idx" ON "SeminaryCourseSchedule"("courseId");
CREATE INDEX "SeminaryCourseSchedule_instructorId_idx" ON "SeminaryCourseSchedule"("instructorId");
CREATE INDEX "SeminaryCourseSchedule_status_idx" ON "SeminaryCourseSchedule"("status");

ALTER TABLE "SeminaryCourseSchedule"
  ADD CONSTRAINT "SeminaryCourseSchedule_courseId_fkey"
  FOREIGN KEY ("courseId") REFERENCES "SeminaryCourse"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeminaryCourseSchedule"
  ADD CONSTRAINT "SeminaryCourseSchedule_instructorId_fkey"
  FOREIGN KEY ("instructorId") REFERENCES "SeminaryInstructor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
