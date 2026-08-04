-- CreateEnum
CREATE TYPE "SeminaryFeeCollectionStatus" AS ENUM ('PENDING', 'PARTIALLY_PAID', 'PAID', 'OVERDUE');

-- CreateTable
CREATE TABLE "SeminaryFeeCollectionAccount" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "studentName" TEXT NOT NULL,
    "program" TEXT NOT NULL,
    "programLevel" "SeminaryProgramLevel" NOT NULL,
    "totalCharges" DECIMAL(12,2) NOT NULL,
    "amountPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "balance" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "paymentMethod" TEXT NOT NULL,
    "status" "SeminaryFeeCollectionStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryFeeCollectionAccount_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryFeeCollectionAccount_referenceNumber_key" ON "SeminaryFeeCollectionAccount"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryFeeCollectionAccount_studentId_key" ON "SeminaryFeeCollectionAccount"("studentId");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_referenceNumber_idx" ON "SeminaryFeeCollectionAccount"("referenceNumber");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_studentId_idx" ON "SeminaryFeeCollectionAccount"("studentId");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_studentName_idx" ON "SeminaryFeeCollectionAccount"("studentName");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_programLevel_idx" ON "SeminaryFeeCollectionAccount"("programLevel");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_status_idx" ON "SeminaryFeeCollectionAccount"("status");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_dueDate_idx" ON "SeminaryFeeCollectionAccount"("dueDate");

-- CreateIndex
CREATE INDEX "SeminaryFeeCollectionAccount_createdAt_idx" ON "SeminaryFeeCollectionAccount"("createdAt");
