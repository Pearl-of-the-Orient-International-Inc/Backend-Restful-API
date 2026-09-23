CREATE TYPE "MemberCertificateType" AS ENUM ('CERTIFICATE', 'RECOGNITION');

ALTER TABLE "MemberCertificate"
ADD COLUMN "type" "MemberCertificateType" NOT NULL DEFAULT 'CERTIFICATE',
ADD COLUMN "issuer" TEXT NOT NULL DEFAULT 'Not specified',
ADD COLUMN "referenceNumber" TEXT,
ADD COLUMN "expiresAt" TIMESTAMP(3);

UPDATE "MemberCertificate"
SET "referenceNumber" = "credentialId"
WHERE "referenceNumber" IS NULL;

ALTER TABLE "MemberCertificate"
ALTER COLUMN "referenceNumber" SET NOT NULL;
