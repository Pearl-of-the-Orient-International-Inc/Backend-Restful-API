ALTER TABLE "MemberCertificate"
ADD COLUMN "credentialId" TEXT;

UPDATE "MemberCertificate"
SET "credentialId" = CONCAT('CERT-LEG-', UPPER(SUBSTRING(REPLACE("id", '-', '') FROM 1 FOR 5)))
WHERE "credentialId" IS NULL;

ALTER TABLE "MemberCertificate"
ALTER COLUMN "credentialId" SET NOT NULL;

CREATE UNIQUE INDEX "MemberCertificate_credentialId_key" ON "MemberCertificate"("credentialId");
