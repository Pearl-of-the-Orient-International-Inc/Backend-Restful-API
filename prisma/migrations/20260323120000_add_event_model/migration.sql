-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('CONFERENCE', 'OUTREACH', 'TRAINING', 'WORSHIP', 'ORIENTATION', 'SEMINAR', 'FELLOWSHIP', 'PRAYER', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('ONSITE', 'ONLINE');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('SCHEDULED', 'ONGOING', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- CreateEnum
CREATE TYPE "EventMeetingPlatform" AS ENUM ('ZOOM', 'GOOGLE_MEET', 'MICROSOFT_TEAMS', 'OTHER');

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" "EventCategory" NOT NULL,
    "type" "EventType" NOT NULL,
    "onlineLink" TEXT,
    "meetingPlatform" "EventMeetingPlatform",
    "meetingId" TEXT,
    "meetingPassword" TEXT,
    "description" TEXT NOT NULL,
    "thumbnailUrl" TEXT NOT NULL,
    "organizer" TEXT NOT NULL,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "status" "EventStatus" NOT NULL DEFAULT 'SCHEDULED',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'PUBLIC',
    "guests" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Event_type_idx" ON "Event"("type");

-- CreateIndex
CREATE INDEX "Event_status_idx" ON "Event"("status");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");
