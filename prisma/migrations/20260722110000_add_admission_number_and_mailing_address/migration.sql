-- AlterTable
ALTER TABLE "SeminaryApplication"
ADD COLUMN "admissionNumber" TEXT,
ADD COLUMN "mailingAddress" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "SeminaryApplication_admissionNumber_key" ON "SeminaryApplication"("admissionNumber");

-- CreateIndex
CREATE INDEX "SeminaryApplication_admissionNumber_idx" ON "SeminaryApplication"("admissionNumber");
