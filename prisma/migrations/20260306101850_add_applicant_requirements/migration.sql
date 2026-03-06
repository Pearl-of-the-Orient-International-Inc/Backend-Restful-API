/*
  Warnings:

  - You are about to drop the column `recentIdPhotoUrl` on the `Member` table. All the data in the column will be lost.

*/
-- CreateEnum
CREATE TYPE "ApplicantRequirementType" AS ENUM ('PHOTO_2X2', 'HS_BACCALAUREATE_DIPLOMA', 'TWO_THREE_YEAR_PROGRAM_DIPLOMA', 'MASTERS_DEGREE_DIPLOMA', 'DOCTORAL_DEGREE_DIPLOMA', 'ORDINATION_CERTIFICATE', 'PASTORS_RECOMMENDATION_LETTER', 'LETTER_OF_INTENT', 'ENDORSEMENT_LETTERS', 'MARRIAGE_CONTRACT', 'CLEARANCE_BARANGAY', 'CLEARANCE_POLICE', 'CLEARANCE_NBI');

-- CreateEnum
CREATE TYPE "RequirementReviewStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Member" DROP COLUMN "recentIdPhotoUrl";

-- CreateTable
CREATE TABLE "ApplicantRequirement" (
    "id" TEXT NOT NULL,
    "type" "ApplicantRequirementType" NOT NULL,
    "reviewStatus" "RequirementReviewStatus" NOT NULL DEFAULT 'PENDING',
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT,
    "mimeType" TEXT,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ApplicantRequirement_memberId_idx" ON "ApplicantRequirement"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantRequirement_memberId_type_key" ON "ApplicantRequirement"("memberId", "type");

-- AddForeignKey
ALTER TABLE "ApplicantRequirement" ADD CONSTRAINT "ApplicantRequirement_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
