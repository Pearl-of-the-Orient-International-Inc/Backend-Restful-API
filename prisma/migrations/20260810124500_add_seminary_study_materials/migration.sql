CREATE TYPE "SeminaryStudyMaterialType" AS ENUM ('NOTES', 'PRESENTATION', 'DOCUMENT', 'CHART', 'ARCHIVE');

CREATE TYPE "SeminaryStudyMaterialStatus" AS ENUM ('PUBLISHED', 'DRAFT');

CREATE TABLE "SeminaryStudyMaterial" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "subtitle" TEXT,
  "subject" TEXT NOT NULL,
  "type" "SeminaryStudyMaterialType" NOT NULL,
  "status" "SeminaryStudyMaterialStatus" NOT NULL DEFAULT 'DRAFT',
  "fileUrl" TEXT NOT NULL,
  "fileName" TEXT NOT NULL,
  "mimeType" TEXT,
  "fileSize" INTEGER,
  "downloads" INTEGER NOT NULL DEFAULT 0,
  "uploadedByName" TEXT NOT NULL,
  "uploadedByRole" TEXT NOT NULL,
  "uploadedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "SeminaryStudyMaterial_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SeminaryStudyMaterial_subject_idx" ON "SeminaryStudyMaterial"("subject");
CREATE INDEX "SeminaryStudyMaterial_type_idx" ON "SeminaryStudyMaterial"("type");
CREATE INDEX "SeminaryStudyMaterial_status_idx" ON "SeminaryStudyMaterial"("status");
CREATE INDEX "SeminaryStudyMaterial_uploadedByUserId_idx" ON "SeminaryStudyMaterial"("uploadedByUserId");
CREATE INDEX "SeminaryStudyMaterial_createdAt_idx" ON "SeminaryStudyMaterial"("createdAt");
