CREATE TYPE "MemoTemplateType" AS ENUM (
  'ANNOUNCEMENT',
  'GENERAL_OFFICE',
  'INCIDENT_REPORT',
  'MEETING_NOTICE',
  'POLICY_CHANGE',
  'BLANK'
);

CREATE TYPE "MemoStatus" AS ENUM (
  'DRAFT',
  'PUBLISHING',
  'PUBLISHED',
  'FAILED',
  'ARCHIVED'
);

CREATE TYPE "MemoRecipientType" AS ENUM (
  'USER',
  'MEMBER'
);

CREATE TYPE "MemoAttachmentKind" AS ENUM (
  'DOCX',
  'PDF'
);

CREATE TYPE "MemoDeliveryStatus" AS ENUM (
  'PENDING',
  'SENT',
  'FAILED'
);

CREATE TABLE "MemoAnnouncement" (
  "id" TEXT NOT NULL,
  "referenceNumber" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" "MemoTemplateType" NOT NULL,
  "customCategory" TEXT,
  "status" "MemoStatus" NOT NULL DEFAULT 'DRAFT',
  "summary" TEXT,
  "documentName" TEXT NOT NULL,
  "docxFilePath" TEXT,
  "pdfFilePath" TEXT,
  "pages" INTEGER,
  "authorUserId" TEXT,
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MemoAnnouncement_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoRecipient" (
  "id" TEXT NOT NULL,
  "memoId" TEXT NOT NULL,
  "userId" TEXT,
  "memberId" TEXT,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "type" "MemoRecipientType" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemoRecipient_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoAttachment" (
  "id" TEXT NOT NULL,
  "memoId" TEXT NOT NULL,
  "kind" "MemoAttachmentKind" NOT NULL,
  "fileName" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MemoAttachment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemoDeliveryLog" (
  "id" TEXT NOT NULL,
  "memoId" TEXT NOT NULL,
  "recipientId" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "status" "MemoDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "messageId" TEXT,
  "error" TEXT,
  "sentAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "MemoDeliveryLog_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemoAnnouncement_referenceNumber_key" ON "MemoAnnouncement"("referenceNumber");
CREATE INDEX "MemoAnnouncement_referenceNumber_idx" ON "MemoAnnouncement"("referenceNumber");
CREATE INDEX "MemoAnnouncement_title_idx" ON "MemoAnnouncement"("title");
CREATE INDEX "MemoAnnouncement_category_idx" ON "MemoAnnouncement"("category");
CREATE INDEX "MemoAnnouncement_status_idx" ON "MemoAnnouncement"("status");
CREATE INDEX "MemoAnnouncement_publishedAt_idx" ON "MemoAnnouncement"("publishedAt");
CREATE INDEX "MemoAnnouncement_createdAt_idx" ON "MemoAnnouncement"("createdAt");
CREATE INDEX "MemoAnnouncement_updatedAt_idx" ON "MemoAnnouncement"("updatedAt");

CREATE UNIQUE INDEX "MemoRecipient_memoId_userId_key" ON "MemoRecipient"("memoId", "userId");
CREATE UNIQUE INDEX "MemoRecipient_memoId_memberId_key" ON "MemoRecipient"("memoId", "memberId");
CREATE INDEX "MemoRecipient_memoId_idx" ON "MemoRecipient"("memoId");
CREATE INDEX "MemoRecipient_userId_idx" ON "MemoRecipient"("userId");
CREATE INDEX "MemoRecipient_memberId_idx" ON "MemoRecipient"("memberId");
CREATE INDEX "MemoRecipient_email_idx" ON "MemoRecipient"("email");

CREATE INDEX "MemoAttachment_memoId_idx" ON "MemoAttachment"("memoId");
CREATE INDEX "MemoAttachment_kind_idx" ON "MemoAttachment"("kind");

CREATE INDEX "MemoDeliveryLog_memoId_idx" ON "MemoDeliveryLog"("memoId");
CREATE INDEX "MemoDeliveryLog_recipientId_idx" ON "MemoDeliveryLog"("recipientId");
CREATE INDEX "MemoDeliveryLog_email_idx" ON "MemoDeliveryLog"("email");
CREATE INDEX "MemoDeliveryLog_status_idx" ON "MemoDeliveryLog"("status");

ALTER TABLE "MemoAnnouncement"
ADD CONSTRAINT "MemoAnnouncement_authorUserId_fkey"
FOREIGN KEY ("authorUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MemoRecipient"
ADD CONSTRAINT "MemoRecipient_memoId_fkey"
FOREIGN KEY ("memoId") REFERENCES "MemoAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemoRecipient"
ADD CONSTRAINT "MemoRecipient_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MemoRecipient"
ADD CONSTRAINT "MemoRecipient_memberId_fkey"
FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "MemoAttachment"
ADD CONSTRAINT "MemoAttachment_memoId_fkey"
FOREIGN KEY ("memoId") REFERENCES "MemoAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemoDeliveryLog"
ADD CONSTRAINT "MemoDeliveryLog_memoId_fkey"
FOREIGN KEY ("memoId") REFERENCES "MemoAnnouncement"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MemoDeliveryLog"
ADD CONSTRAINT "MemoDeliveryLog_recipientId_fkey"
FOREIGN KEY ("recipientId") REFERENCES "MemoRecipient"("id") ON DELETE CASCADE ON UPDATE CASCADE;
