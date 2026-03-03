/*
  Warnings:

  - You are about to drop the `Office` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "CivilStatus" AS ENUM ('SINGLE', 'MARRIED', 'WIDOWED', 'SEPARATED', 'ANNULLED');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE', 'PREFER_NOT_TO_SAY');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'UPLOADED');

-- CreateEnum
CREATE TYPE "OfficeTitleLevel" AS ENUM ('CHIEF_CHAPLAIN', 'NATIONAL_CHAPLAIN_DIRECTOR', 'REGIONAL_CHAPLAIN_DIRECTOR', 'REGIONAL_DEPUTY_CHAPLAIN_DIRECTOR', 'PROVINCIAL_CHAPLAIN_DIRECTOR', 'PROVINCIAL_DEPUTY_CHAPLAIN_DIRECTOR', 'CITY_CHAPLAIN', 'MUNICIPAL_CHAPLAIN', 'CITY_MUNICIPAL_DEPUTY_CHAPLAIN', 'BARANGAY_CHAPLAIN', 'BARANGAY_DEPUTY_CHAPLAIN');

-- CreateEnum
CREATE TYPE "BranchOfService" AS ENUM ('HUMANITARIAN', 'HOSPITAL_AND_CARE', 'MILITARY_PNP', 'SCHOOL', 'CORPORATE', 'DISASTER_AND_RESCUE_OPERATIONS', 'PRISON', 'SECURITY', 'GOVERNMENT', 'DSWD', 'OTHERS');

-- AlterEnum
ALTER TYPE "UserType" ADD VALUE 'OFFICER';

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "role" SET DEFAULT 'MEMBER';

-- DropTable
DROP TABLE "Office";

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "mobilePhoneNumber" TEXT NOT NULL,
    "homeAddress" TEXT NOT NULL,
    "civilStatus" "CivilStatus" NOT NULL,
    "gender" "Gender" NOT NULL,
    "nationality" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "province" TEXT NOT NULL,
    "municipalityCity" TEXT NOT NULL,
    "barangay" TEXT NOT NULL,
    "emergencyContactName" TEXT NOT NULL,
    "emergencyContactMobile" TEXT NOT NULL,
    "recentIdPhotoUrl" TEXT,
    "churchAffiliation" TEXT NOT NULL,
    "churchAddress" TEXT NOT NULL,
    "currentPositionRole" TEXT NOT NULL,
    "currentPositionRoleOther" TEXT,
    "height" TEXT,
    "weight" TEXT,
    "bloodType" TEXT,
    "colorOfEyes" TEXT,
    "colorOfSkin" TEXT,
    "sssNumber" TEXT,
    "tinNumber" TEXT,
    "skillsTalents" TEXT,
    "preferredBranches" "BranchOfService"[],
    "preferredBranchOther" TEXT,
    "elementarySchool" TEXT,
    "secondarySchool" TEXT,
    "tertiaryCollege" TEXT,
    "postGraduateStudies" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MinisterialExperience" (
    "id" TEXT NOT NULL,
    "roleDescription" TEXT NOT NULL,
    "yearsApprox" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MinisterialExperience_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CharacterReference" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "positionRelationship" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CharacterReference_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApplicantSignature" (
    "id" TEXT NOT NULL,
    "type" "SignatureType" NOT NULL,
    "signatureData" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApplicantSignature_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficeTitle" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" "OfficeTitleLevel" NOT NULL,
    "description" TEXT,
    "maxSlots" INTEGER,
    "sections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficeTitle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OfficerAssignment" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "officeTitleId" TEXT NOT NULL,
    "department" TEXT,
    "region" TEXT,
    "province" TEXT,
    "cityMunicipality" TEXT,
    "barangay" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OfficerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Member_userId_key" ON "Member"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ApplicantSignature_memberId_key" ON "ApplicantSignature"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficeTitle_name_key" ON "OfficeTitle"("name");

-- CreateIndex
CREATE INDEX "OfficerAssignment_memberId_idx" ON "OfficerAssignment"("memberId");

-- CreateIndex
CREATE INDEX "OfficerAssignment_officeTitleId_idx" ON "OfficerAssignment"("officeTitleId");

-- CreateIndex
CREATE UNIQUE INDEX "OfficerAssignment_memberId_officeTitleId_department_region__key" ON "OfficerAssignment"("memberId", "officeTitleId", "department", "region", "province", "cityMunicipality", "barangay");

-- AddForeignKey
ALTER TABLE "Member" ADD CONSTRAINT "Member_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MinisterialExperience" ADD CONSTRAINT "MinisterialExperience_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CharacterReference" ADD CONSTRAINT "CharacterReference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApplicantSignature" ADD CONSTRAINT "ApplicantSignature_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OfficerAssignment" ADD CONSTRAINT "OfficerAssignment_officeTitleId_fkey" FOREIGN KEY ("officeTitleId") REFERENCES "OfficeTitle"("id") ON DELETE CASCADE ON UPDATE CASCADE;
