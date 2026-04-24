-- AlterTable
ALTER TABLE "NewsBlog"
ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;

-- CreateIndex
CREATE INDEX "NewsBlog_isActive_idx" ON "NewsBlog"("isActive");
