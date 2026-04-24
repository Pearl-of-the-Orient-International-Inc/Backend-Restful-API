-- CreateEnum
CREATE TYPE "NewsBlogStatus" AS ENUM ('DRAFT', 'SCHEDULED', 'PUBLISHED');

-- CreateEnum
CREATE TYPE "NewsBlogPlatform" AS ENUM ('FACEBOOK');

-- CreateEnum
CREATE TYPE "NewsBlogMediaKind" AS ENUM ('IMAGE', 'VIDEO');

-- CreateTable
CREATE TABLE "NewsBlog" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "caption" TEXT NOT NULL,
    "status" "NewsBlogStatus" NOT NULL DEFAULT 'DRAFT',
    "platform" "NewsBlogPlatform" NOT NULL DEFAULT 'FACEBOOK',
    "hashtags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsBlog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsBlogMedia" (
    "id" TEXT NOT NULL,
    "newsBlogId" TEXT NOT NULL,
    "kind" "NewsBlogMediaKind" NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsBlogMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NewsBlogTaggedMember" (
    "id" TEXT NOT NULL,
    "newsBlogId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "taggedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsBlogTaggedMember_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsBlog_status_idx" ON "NewsBlog"("status");

-- CreateIndex
CREATE INDEX "NewsBlog_platform_idx" ON "NewsBlog"("platform");

-- CreateIndex
CREATE INDEX "NewsBlog_scheduledAt_idx" ON "NewsBlog"("scheduledAt");

-- CreateIndex
CREATE INDEX "NewsBlog_createdAt_idx" ON "NewsBlog"("createdAt");

-- CreateIndex
CREATE INDEX "NewsBlog_updatedAt_idx" ON "NewsBlog"("updatedAt");

-- CreateIndex
CREATE INDEX "NewsBlogMedia_newsBlogId_idx" ON "NewsBlogMedia"("newsBlogId");

-- CreateIndex
CREATE INDEX "NewsBlogMedia_sortOrder_idx" ON "NewsBlogMedia"("sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "NewsBlogTaggedMember_newsBlogId_memberId_key" ON "NewsBlogTaggedMember"("newsBlogId", "memberId");

-- CreateIndex
CREATE INDEX "NewsBlogTaggedMember_newsBlogId_idx" ON "NewsBlogTaggedMember"("newsBlogId");

-- CreateIndex
CREATE INDEX "NewsBlogTaggedMember_memberId_idx" ON "NewsBlogTaggedMember"("memberId");

-- AddForeignKey
ALTER TABLE "NewsBlogMedia" ADD CONSTRAINT "NewsBlogMedia_newsBlogId_fkey" FOREIGN KEY ("newsBlogId") REFERENCES "NewsBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsBlogTaggedMember" ADD CONSTRAINT "NewsBlogTaggedMember_newsBlogId_fkey" FOREIGN KEY ("newsBlogId") REFERENCES "NewsBlog"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NewsBlogTaggedMember" ADD CONSTRAINT "NewsBlogTaggedMember_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
