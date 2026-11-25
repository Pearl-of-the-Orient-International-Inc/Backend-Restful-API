DROP INDEX "SeminaryAttendanceSession_academicYear_className_attendanceDate_key";

ALTER TABLE "SeminaryAttendanceSession" RENAME COLUMN "className" TO "program";

ALTER TABLE "SeminaryAttendanceSession" ADD COLUMN "courseId" TEXT NOT NULL DEFAULT '';

ALTER TABLE "SeminaryAttendanceSession" ALTER COLUMN "courseId" DROP DEFAULT;

CREATE UNIQUE INDEX "SeminaryAttendanceSession_academicYear_program_courseId_attendanceDate_key"
ON "SeminaryAttendanceSession"("academicYear", "program", "courseId", "attendanceDate");
