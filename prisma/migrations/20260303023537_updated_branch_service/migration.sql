/*
  Warnings:

  - You are about to drop the column `preferredBranches` on the `Member` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Member" DROP COLUMN "preferredBranches";

-- DropEnum
DROP TYPE "BranchOfService";

-- CreateTable
CREATE TABLE "BranchOfService" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "sections" JSONB NOT NULL,
    "memberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BranchOfService_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "BranchOfService" ADD CONSTRAINT "BranchOfService_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
