-- CreateEnum
CREATE TYPE "SeminaryCredentialDocumentType" AS ENUM ('DIPLOMA', 'CERTIFICATE', 'TRANSCRIPT');

-- CreateEnum
CREATE TYPE "SeminaryCredentialDocumentStatus" AS ENUM ('ACTIVE', 'REVOKED', 'VOID');

-- CreateTable
CREATE TABLE "SeminaryCredentialDocument" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "type" "SeminaryCredentialDocumentType" NOT NULL,
    "status" "SeminaryCredentialDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "remarks" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "applicationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryCredentialDocument_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryCredentialDocument_documentNumber_key" ON "SeminaryCredentialDocument"("documentNumber");

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryCredentialDocument_verificationToken_key" ON "SeminaryCredentialDocument"("verificationToken");

-- CreateIndex
CREATE INDEX "SeminaryCredentialDocument_applicationId_idx" ON "SeminaryCredentialDocument"("applicationId");

-- CreateIndex
CREATE INDEX "SeminaryCredentialDocument_type_idx" ON "SeminaryCredentialDocument"("type");

-- CreateIndex
CREATE INDEX "SeminaryCredentialDocument_status_idx" ON "SeminaryCredentialDocument"("status");

-- CreateIndex
CREATE INDEX "SeminaryCredentialDocument_issuedAt_idx" ON "SeminaryCredentialDocument"("issuedAt");

-- AddForeignKey
ALTER TABLE "SeminaryCredentialDocument" ADD CONSTRAINT "SeminaryCredentialDocument_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "SeminaryApplication"("id") ON DELETE CASCADE ON UPDATE CASCADE;
