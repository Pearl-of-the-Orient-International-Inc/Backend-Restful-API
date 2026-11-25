CREATE TYPE "SeminaryAttendanceStatus" AS ENUM ('PRESENT', 'ABSENT', 'LATE');

CREATE TABLE "SeminaryAttendanceSession" (
  "id" TEXT NOT NULL,
  "academicYear" TEXT NOT NULL,
  "className" TEXT NOT NULL,
  "section" TEXT NOT NULL,
  "attendanceDate" DATE NOT NULL,
  "createdByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeminaryAttendanceSession_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "SeminaryAttendanceEntry" (
  "id" TEXT NOT NULL,
  "sessionId" TEXT NOT NULL,
  "applicationId" TEXT NOT NULL,
  "status" "SeminaryAttendanceStatus" NOT NULL DEFAULT 'PRESENT',
  "remarks" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeminaryAttendanceEntry_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "SeminaryAttendanceSession_academicYear_className_section_attendanceDate_key" ON "SeminaryAttendanceSession"("academicYear", "className", "section", "attendanceDate");
CREATE UNIQUE INDEX "SeminaryAttendanceEntry_sessionId_applicationId_key" ON "SeminaryAttendanceEntry"("sessionId", "applicationId");
ALTER TABLE "SeminaryAttendanceEntry" ADD CONSTRAINT "SeminaryAttendanceEntry_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "SeminaryAttendanceSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeminaryAttendanceEntry" ADD CONSTRAINT "SeminaryAttendanceEntry_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SeminaryApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
