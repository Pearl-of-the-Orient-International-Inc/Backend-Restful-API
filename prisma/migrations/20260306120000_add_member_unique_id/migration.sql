-- Add unique member ID format field (e.g., 262-00037)
ALTER TABLE "Member"
ADD COLUMN "uniqueId" TEXT;

CREATE UNIQUE INDEX "Member_uniqueId_key" ON "Member"("uniqueId");
