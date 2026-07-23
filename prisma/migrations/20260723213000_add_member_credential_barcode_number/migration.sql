ALTER TABLE "MemberCredentialDocument" ADD COLUMN "barcodeNumber" TEXT;

CREATE UNIQUE INDEX "MemberCredentialDocument_barcodeNumber_key" ON "MemberCredentialDocument"("barcodeNumber");
CREATE INDEX "MemberCredentialDocument_barcodeNumber_idx" ON "MemberCredentialDocument"("barcodeNumber");
