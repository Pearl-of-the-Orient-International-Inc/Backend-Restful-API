CREATE TYPE "SeminaryAnnouncementKind" AS ENUM ('ANNOUNCEMENT', 'EVENT');
CREATE TYPE "SeminaryAnnouncementCategory" AS ENUM ('ACADEMIC', 'ADMINISTRATION', 'FORMATION', 'ADMISSIONS');
CREATE TYPE "SeminaryAnnouncementAudience" AS ENUM ('ALL', 'STUDENTS', 'INSTRUCTORS', 'STUDENTS_AND_INSTRUCTORS');
CREATE TYPE "SeminaryAnnouncementStatus" AS ENUM ('DRAFT', 'PUBLISHED');

CREATE TABLE "SeminaryAnnouncement" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "summary" TEXT,
    "kind" "SeminaryAnnouncementKind" NOT NULL DEFAULT 'ANNOUNCEMENT',
    "category" "SeminaryAnnouncementCategory" NOT NULL DEFAULT 'ADMINISTRATION',
    "audience" "SeminaryAnnouncementAudience" NOT NULL DEFAULT 'ALL',
    "location" TEXT,
    "allDay" BOOLEAN NOT NULL DEFAULT false,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "status" "SeminaryAnnouncementStatus" NOT NULL DEFAULT 'PUBLISHED',
    "createdByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeminaryAnnouncement_startsAt_idx" ON "SeminaryAnnouncement"("startsAt");
CREATE INDEX "SeminaryAnnouncement_status_idx" ON "SeminaryAnnouncement"("status");
CREATE INDEX "SeminaryAnnouncement_audience_idx" ON "SeminaryAnnouncement"("audience");
CREATE INDEX "SeminaryAnnouncement_createdByUserId_idx" ON "SeminaryAnnouncement"("createdByUserId");

ALTER TABLE "SeminaryAnnouncement" ADD CONSTRAINT "SeminaryAnnouncement_createdByUserId_fkey"
  FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
