-- AlterTable
ALTER TABLE "SeminaryCredentialDocument" ADD COLUMN "barcodeNumber" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryCredentialDocument_barcodeNumber_key" ON "SeminaryCredentialDocument"("barcodeNumber");
