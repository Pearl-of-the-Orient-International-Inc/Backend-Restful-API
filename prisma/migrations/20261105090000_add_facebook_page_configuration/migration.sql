CREATE TABLE "FacebookPageConfiguration" (
  "id" TEXT NOT NULL DEFAULT 'default',
  "pageId" TEXT NOT NULL,
  "accessToken" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3),
  "updatedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FacebookPageConfiguration_pkey" PRIMARY KEY ("id")
);
