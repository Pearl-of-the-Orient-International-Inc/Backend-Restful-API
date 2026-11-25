DROP INDEX "SeminaryAttendanceSession_academicYear_className_section_attendanceDate_key";

ALTER TABLE "SeminaryAttendanceSession" DROP COLUMN "section";

CREATE UNIQUE INDEX "SeminaryAttendanceSession_academicYear_className_attendanceDate_key"
ON "SeminaryAttendanceSession"("academicYear", "className", "attendanceDate");

