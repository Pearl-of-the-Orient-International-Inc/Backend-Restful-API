CREATE TABLE "MemberPublicRecordAttachment" (
  "id" TEXT NOT NULL,
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT,
  "mimeType" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "publicRecordId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemberPublicRecordAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "MemberPublicRecordAttachment_publicRecordId_sortOrder_idx"
ON "MemberPublicRecordAttachment"("publicRecordId", "sortOrder");

ALTER TABLE "MemberPublicRecordAttachment"
ADD CONSTRAINT "MemberPublicRecordAttachment_publicRecordId_fkey"
FOREIGN KEY ("publicRecordId") REFERENCES "MemberPublicRecord"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
