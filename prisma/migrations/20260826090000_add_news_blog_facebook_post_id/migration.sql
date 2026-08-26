ALTER TABLE "NewsBlog"
ADD COLUMN "facebookPostId" TEXT;

CREATE INDEX "NewsBlog_facebookPostId_idx" ON "NewsBlog"("facebookPostId");
