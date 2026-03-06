-- CreateEnum
CREATE TYPE "InterviewDay" AS ENUM ('SATURDAY', 'SUNDAY');

-- CreateTable
CREATE TABLE "MemberOnlineInterviewAppointment" (
    "id" TEXT NOT NULL,
    "interviewerId" TEXT NOT NULL,
    "interviewerName" TEXT NOT NULL,
    "day" "InterviewDay" NOT NULL,
    "timeSlot" TEXT NOT NULL,
    "zoomLink" TEXT NOT NULL,
    "meetingId" TEXT,
    "passcode" TEXT,
    "confirmedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberOnlineInterviewAppointment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberOnlineInterviewAppointment_memberId_key" ON "MemberOnlineInterviewAppointment"("memberId");

-- AddForeignKey
ALTER TABLE "MemberOnlineInterviewAppointment" ADD CONSTRAINT "MemberOnlineInterviewAppointment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
