-- CreateTable
CREATE TABLE "EventTaggedMember" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EventTaggedMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "EventTaggedMember_eventId_memberId_key" ON "EventTaggedMember"("eventId", "memberId");

-- CreateIndex
CREATE INDEX "EventTaggedMember_eventId_idx" ON "EventTaggedMember"("eventId");

-- CreateIndex
CREATE INDEX "EventTaggedMember_memberId_idx" ON "EventTaggedMember"("memberId");

-- AddForeignKey
ALTER TABLE "EventTaggedMember" ADD CONSTRAINT "EventTaggedMember_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "Event"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventTaggedMember" ADD CONSTRAINT "EventTaggedMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
