CREATE TYPE "SeminaryDocumentDeliveryMethod" AS ENUM ('PICKUP', 'EMAIL', 'COURIER');
CREATE TYPE "SeminaryDocumentRequestStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED', 'PROCESSING', 'READY_FOR_RELEASE', 'RELEASED');
CREATE TYPE "SeminaryDocumentPaymentStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'PAID', 'WAIVED');

CREATE TABLE "SeminaryDocumentRequestType" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "fee" DECIMAL(12,2),
  "requiresSupportingDetails" BOOLEAN NOT NULL DEFAULT false,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeminaryDocumentRequestType_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeminaryDocumentRequestType_name_key" ON "SeminaryDocumentRequestType"("name");
CREATE INDEX "SeminaryDocumentRequestType_isActive_idx" ON "SeminaryDocumentRequestType"("isActive");
CREATE INDEX "SeminaryDocumentRequestType_sortOrder_idx" ON "SeminaryDocumentRequestType"("sortOrder");

CREATE TABLE "SeminaryDocumentRequest" (
  "id" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "purpose" TEXT NOT NULL,
  "deliveryMethod" "SeminaryDocumentDeliveryMethod" NOT NULL,
  "supportingDetails" TEXT,
  "fee" DECIMAL(12,2),
  "paymentStatus" "SeminaryDocumentPaymentStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  "status" "SeminaryDocumentRequestStatus" NOT NULL DEFAULT 'PENDING',
  "reviewedAt" TIMESTAMP(3),
  "reviewRemarks" TEXT,
  "processedAt" TIMESTAMP(3),
  "readyAt" TIMESTAMP(3),
  "releasedAt" TIMESTAMP(3),
  "releaseReference" TEXT,
  "receivedBy" TEXT,
  "documentTypeId" TEXT NOT NULL,
  "studentApplicationId" TEXT NOT NULL,
  "reviewedByUserId" TEXT,
  "releasedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SeminaryDocumentRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SeminaryDocumentRequest_referenceNumber_key" ON "SeminaryDocumentRequest"("referenceNumber");
CREATE INDEX "SeminaryDocumentRequest_studentApplicationId_idx" ON "SeminaryDocumentRequest"("studentApplicationId");
CREATE INDEX "SeminaryDocumentRequest_documentTypeId_idx" ON "SeminaryDocumentRequest"("documentTypeId");
CREATE INDEX "SeminaryDocumentRequest_status_idx" ON "SeminaryDocumentRequest"("status");
CREATE INDEX "SeminaryDocumentRequest_paymentStatus_idx" ON "SeminaryDocumentRequest"("paymentStatus");
CREATE INDEX "SeminaryDocumentRequest_createdAt_idx" ON "SeminaryDocumentRequest"("createdAt");

ALTER TABLE "SeminaryDocumentRequest"
  ADD CONSTRAINT "SeminaryDocumentRequest_documentTypeId_fkey"
  FOREIGN KEY ("documentTypeId") REFERENCES "SeminaryDocumentRequestType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "SeminaryDocumentRequest"
  ADD CONSTRAINT "SeminaryDocumentRequest_studentApplicationId_fkey"
  FOREIGN KEY ("studentApplicationId") REFERENCES "SeminaryApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SeminaryDocumentRequest"
  ADD CONSTRAINT "SeminaryDocumentRequest_reviewedByUserId_fkey"
  FOREIGN KEY ("reviewedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SeminaryDocumentRequest"
  ADD CONSTRAINT "SeminaryDocumentRequest_releasedByUserId_fkey"
  FOREIGN KEY ("releasedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "SeminaryDocumentRequestType" ("id", "name", "description", "fee", "requiresSupportingDetails", "sortOrder", "updatedAt")
VALUES
  ('4f5d4241-51a5-4c0b-8ab0-000000000001', 'Diploma', 'Official Seminary diploma or replacement diploma request.', NULL, true, 10, CURRENT_TIMESTAMP),
  ('4f5d4241-51a5-4c0b-8ab0-000000000002', 'Transcript of Records', 'Official record of completed Seminary subjects and grades.', NULL, false, 20, CURRENT_TIMESTAMP),
  ('4f5d4241-51a5-4c0b-8ab0-000000000003', 'Certificate of Enrollment', 'Certification of current Seminary enrollment.', NULL, false, 30, CURRENT_TIMESTAMP),
  ('4f5d4241-51a5-4c0b-8ab0-000000000004', 'Certificate of Grades', 'Certification of grades for a stated purpose.', NULL, false, 40, CURRENT_TIMESTAMP),
  ('4f5d4241-51a5-4c0b-8ab0-000000000005', 'Good Moral Certificate', 'Certification of good moral standing.', NULL, true, 50, CURRENT_TIMESTAMP)
ON CONFLICT ("name") DO NOTHING;
