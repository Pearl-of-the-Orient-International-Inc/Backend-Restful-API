-- CreateEnum
CREATE TYPE "EventAttendeeAccessLevel" AS ENUM ('FULL_ACCESS');

-- CreateEnum
CREATE TYPE "EventAttendeeInviteStatus" AS ENUM ('INVITED', 'ACCEPTED');

-- CreateTable
CREATE TABLE "EventAttendee" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "accessLevel" "EventAttendeeAccessLevel" NOT NULL DEFAULT 'FULL_ACCESS',
    "inviteStatus" "EventAttendeeInviteStatus" NOT NULL DEFAULT 'INVITED',
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EventAttendee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EventAttendee_eventId_idx" ON "EventAttendee"("eventId");

-- CreateIndex
CREATE INDEX "EventAttendee_memberId_idx" ON "EventAttendee"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "EventAttendee_eventId_memberId_key" ON "EventAttendee"("eventId", "memberId");

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventAttendee" ADD CONSTRAINT "EventAttendee_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
