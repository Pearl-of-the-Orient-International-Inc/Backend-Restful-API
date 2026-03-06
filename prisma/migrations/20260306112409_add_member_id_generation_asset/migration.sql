-- CreateTable
CREATE TABLE "MemberIdGenerationAsset" (
    "id" TEXT NOT NULL,
    "profileUrl" TEXT NOT NULL,
    "qrCodeUrl" TEXT NOT NULL,
    "certificateUrl" TEXT NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberIdGenerationAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberIdGenerationAsset_memberId_key" ON "MemberIdGenerationAsset"("memberId");

-- AddForeignKey
ALTER TABLE "MemberIdGenerationAsset" ADD CONSTRAINT "MemberIdGenerationAsset_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
