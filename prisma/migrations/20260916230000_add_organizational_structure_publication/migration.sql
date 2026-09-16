-- Public organization structure controls and reporting hierarchy.
ALTER TABLE "OfficeTitle"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN "reportsToId" TEXT;

ALTER TABLE "OfficerAssignment"
ADD COLUMN "isPublic" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "OfficeTitle"
ADD CONSTRAINT "OfficeTitle_reportsToId_fkey"
FOREIGN KEY ("reportsToId") REFERENCES "OfficeTitle"("id")
ON DELETE SET NULL ON UPDATE CASCADE;

CREATE INDEX "OfficeTitle_reportsToId_idx" ON "OfficeTitle"("reportsToId");
CREATE INDEX "OfficeTitle_isActive_isPublic_sortOrder_idx"
ON "OfficeTitle"("isActive", "isPublic", "sortOrder");
CREATE INDEX "OfficerAssignment_isActive_isPublic_idx"
ON "OfficerAssignment"("isActive", "isPublic");
