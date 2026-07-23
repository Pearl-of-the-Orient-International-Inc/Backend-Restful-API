CREATE TYPE "MemberCredentialDocumentType" AS ENUM ('CERTIFICATE', 'RECOGNITION');

CREATE TYPE "MemberCredentialDocumentStatus" AS ENUM ('ACTIVE', 'REVOKED');

CREATE TABLE "MemberCredentialDocument" (
    "id" TEXT NOT NULL,
    "documentNumber" TEXT NOT NULL,
    "verificationToken" TEXT NOT NULL,
    "type" "MemberCredentialDocumentType" NOT NULL,
    "status" "MemberCredentialDocumentStatus" NOT NULL DEFAULT 'ACTIVE',
    "title" TEXT,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberCredentialDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberCredentialDocument_documentNumber_key" ON "MemberCredentialDocument"("documentNumber");
CREATE UNIQUE INDEX "MemberCredentialDocument_verificationToken_key" ON "MemberCredentialDocument"("verificationToken");
CREATE UNIQUE INDEX "MemberCredentialDocument_memberId_type_key" ON "MemberCredentialDocument"("memberId", "type");
CREATE INDEX "MemberCredentialDocument_type_status_idx" ON "MemberCredentialDocument"("type", "status");
CREATE INDEX "MemberCredentialDocument_documentNumber_idx" ON "MemberCredentialDocument"("documentNumber");
CREATE INDEX "MemberCredentialDocument_verificationToken_idx" ON "MemberCredentialDocument"("verificationToken");
CREATE INDEX "MemberCredentialDocument_issuedAt_idx" ON "MemberCredentialDocument"("issuedAt");

ALTER TABLE "MemberCredentialDocument" ADD CONSTRAINT "MemberCredentialDocument_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
