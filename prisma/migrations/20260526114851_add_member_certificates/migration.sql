-- AlterTable
ALTER TABLE "MemberIdGenerationAsset" DROP COLUMN "certificateUrl";

-- CreateTable
CREATE TABLE "MemberCertificate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "dateReceived" TIMESTAMP(3) NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemberCertificate_memberId_dateReceived_idx" ON "MemberCertificate"("memberId", "dateReceived");

-- AddForeignKey
ALTER TABLE "MemberCertificate" ADD CONSTRAINT "MemberCertificate_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
