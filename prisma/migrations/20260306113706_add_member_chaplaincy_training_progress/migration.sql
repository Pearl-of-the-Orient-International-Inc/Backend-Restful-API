-- CreateTable
CREATE TABLE "MemberChaplaincyTrainingProgress" (
    "id" TEXT NOT NULL,
    "completedLessonIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "essayAnswers" JSONB NOT NULL DEFAULT '{}',
    "completedAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberChaplaincyTrainingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberChaplaincyTrainingProgress_memberId_key" ON "MemberChaplaincyTrainingProgress"("memberId");

-- AddForeignKey
ALTER TABLE "MemberChaplaincyTrainingProgress" ADD CONSTRAINT "MemberChaplaincyTrainingProgress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
