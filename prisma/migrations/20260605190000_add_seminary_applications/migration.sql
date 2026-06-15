CREATE TYPE "SeminaryApplicationStatus" AS ENUM (
  'SUBMITTED',
  'UNDER_REVIEW',
  'APPROVED',
  'REJECTED',
  'CANCELLED'
);

CREATE TYPE "SeminaryProgramLevel" AS ENUM (
  'CERTIFICATE',
  'BACHELOR',
  'MASTER_WITH_THESIS',
  'DOCTORATE_WITH_DISSERTATION'
);

CREATE TYPE "SeminaryPaymentType" AS ENUM (
  'FULL_PAYMENT',
  'PARTIAL_PAYMENT'
);

CREATE TYPE "SeminaryPaymentMethod" AS ENUM (
  'BANK_TRANSFER',
  'GCASH',
  'MAYA'
);

CREATE TYPE "SeminaryPaymentStatus" AS ENUM (
  'PENDING',
  'VERIFIED',
  'REJECTED'
);

CREATE TABLE "SeminaryApplication" (
  "id" TEXT NOT NULL,
  "status" "SeminaryApplicationStatus" NOT NULL DEFAULT 'SUBMITTED',
  "targetMemberType" "MemberType" NOT NULL DEFAULT 'PROFESSIONAL_CHAPLAIN',
  "academicYear" TEXT,
  "surname" TEXT NOT NULL,
  "givenName" TEXT NOT NULL,
  "middleName" TEXT,
  "emailAddress" TEXT,
  "mobilePhone" TEXT,
  "homeAddress" TEXT,
  "dateOfBirth" TIMESTAMP(3),
  "birthPlace" TEXT,
  "age" INTEGER,
  "gender" "Gender",
  "height" TEXT,
  "weight" TEXT,
  "civilStatus" "CivilStatus",
  "officePhone" TEXT,
  "churchAttended" TEXT,
  "churchAddress" TEXT,
  "pastorName" TEXT,
  "contactNumber" TEXT,
  "ministryInvolved" TEXT,
  "programLevel" "SeminaryProgramLevel" NOT NULL,
  "programCourse" TEXT NOT NULL,
  "highSchool" TEXT,
  "highSchoolYearGraduated" TEXT,
  "collegeSchool" TEXT,
  "collegeCourse" TEXT,
  "collegeYearGraduated" TEXT,
  "vocationalSchool" TEXT,
  "vocationalCourse" TEXT,
  "vocationalYearGraduated" TEXT,
  "othersSchool" TEXT,
  "othersCourse" TEXT,
  "othersYearGraduated" TEXT,
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "reviewedAt" TIMESTAMP(3),
  "reviewRemarks" TEXT,
  "memberId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryApplication_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeminaryRequirements" (
  "id" TEXT NOT NULL,
  "transcriptOfRecordsUrl" TEXT,
  "transcriptOfRecordsFileName" TEXT,
  "transcriptOfRecordsMimeType" TEXT,
  "transcriptOfRecordsFileSize" TEXT,
  "idPictureUrl" TEXT,
  "idPictureFileName" TEXT,
  "idPictureMimeType" TEXT,
  "idPictureFileSize" TEXT,
  "pastorRecommendationUrl" TEXT,
  "pastorRecommendationFileName" TEXT,
  "pastorRecommendationMimeType" TEXT,
  "pastorRecommendationFileSize" TEXT,
  "briefHistoryOfConversion" TEXT,
  "applicationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryRequirements_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SeminaryPayment" (
  "id" TEXT NOT NULL,
  "paymentType" "SeminaryPaymentType" NOT NULL,
  "paymentMethod" "SeminaryPaymentMethod" NOT NULL,
  "amountPaid" DECIMAL(12, 2) NOT NULL,
  "totalAmountDue" DECIMAL(12, 2) NOT NULL,
  "status" "SeminaryPaymentStatus" NOT NULL DEFAULT 'PENDING',
  "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "verifiedAt" TIMESTAMP(3),
  "reviewRemarks" TEXT,
  "proofOfReceiptUrl" TEXT,
  "proofOfReceiptFileName" TEXT,
  "proofOfReceiptMimeType" TEXT,
  "proofOfReceiptFileSize" TEXT,
  "applicationId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryPayment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeminaryApplication_memberId_idx"
ON "SeminaryApplication"("memberId");

CREATE INDEX "SeminaryApplication_status_idx"
ON "SeminaryApplication"("status");

CREATE INDEX "SeminaryApplication_targetMemberType_idx"
ON "SeminaryApplication"("targetMemberType");

CREATE INDEX "SeminaryApplication_createdAt_idx"
ON "SeminaryApplication"("createdAt");

CREATE UNIQUE INDEX "SeminaryRequirements_applicationId_key"
ON "SeminaryRequirements"("applicationId");

CREATE UNIQUE INDEX "SeminaryPayment_applicationId_key"
ON "SeminaryPayment"("applicationId");

CREATE INDEX "SeminaryPayment_status_idx"
ON "SeminaryPayment"("status");

ALTER TABLE "SeminaryApplication"
ADD CONSTRAINT "SeminaryApplication_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeminaryRequirements"
ADD CONSTRAINT "SeminaryRequirements_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "SeminaryApplication"("id")
ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "SeminaryPayment"
ADD CONSTRAINT "SeminaryPayment_applicationId_fkey"
FOREIGN KEY ("applicationId") REFERENCES "SeminaryApplication"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
