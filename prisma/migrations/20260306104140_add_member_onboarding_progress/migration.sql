-- CreateEnum
CREATE TYPE "MemberOnboardingStep" AS ENUM ('REQUIREMENTS', 'PRE_ORIENTATION', 'PAYMENT_CHECKOUT', 'ONLINE_INTERVIEW', 'ID_GENERATION', 'CHAPLAINCY_101', 'OATH_TAKING');

-- CreateTable
CREATE TABLE "MemberOnboardingProgress" (
    "id" TEXT NOT NULL,
    "currentStep" "MemberOnboardingStep" NOT NULL DEFAULT 'REQUIREMENTS',
    "preOrientationCompletedLessonIds" INTEGER[] DEFAULT ARRAY[]::INTEGER[],
    "preOrientationCompletedAt" TIMESTAMP(3),
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberOnboardingProgress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberOnboardingProgress_memberId_key" ON "MemberOnboardingProgress"("memberId");

-- AddForeignKey
ALTER TABLE "MemberOnboardingProgress" ADD CONSTRAINT "MemberOnboardingProgress_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
