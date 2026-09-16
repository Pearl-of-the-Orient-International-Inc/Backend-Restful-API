CREATE TYPE "BulletinEntryType" AS ENUM ('NOTICE', 'ANNOUNCEMENT', 'MEMO', 'EVENT', 'OTHER');

CREATE TYPE "BulletinEntryStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED');

CREATE TABLE "BulletinEntry" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" "BulletinEntryType" NOT NULL,
    "status" "BulletinEntryStatus" NOT NULL DEFAULT 'DRAFT',
    "publicationDate" TIMESTAMP(3),
    "scheduledAt" TIMESTAMP(3),
    "authorName" TEXT,
    "issuingOffice" TEXT,
    "featuredImageUrl" TEXT,
    "featuredImageFileName" TEXT,
    "attachmentUrl" TEXT,
    "attachmentFileName" TEXT,
    "attachmentMimeType" TEXT,
    "authorUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BulletinEntry_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "BulletinEntry_type_idx" ON "BulletinEntry"("type");
CREATE INDEX "BulletinEntry_status_idx" ON "BulletinEntry"("status");
CREATE INDEX "BulletinEntry_publicationDate_idx" ON "BulletinEntry"("publicationDate");
CREATE INDEX "BulletinEntry_scheduledAt_idx" ON "BulletinEntry"("scheduledAt");
CREATE INDEX "BulletinEntry_createdAt_idx" ON "BulletinEntry"("createdAt");

ALTER TABLE "BulletinEntry" ADD CONSTRAINT "BulletinEntry_authorUserId_fkey" FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
