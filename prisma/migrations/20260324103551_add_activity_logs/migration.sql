-- CreateEnum
CREATE TYPE "ActivityLogActionType" AS ENUM ('AUTH', 'CREATE', 'UPDATE', 'DELETE', 'EXPORT', 'INVITE', 'ASSIGN', 'REVIEW', 'SECURITY');

-- CreateEnum
CREATE TYPE "ActivityLogResult" AS ENUM ('SUCCESS', 'WARNING', 'FAILED');

-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "actorName" TEXT NOT NULL,
    "actorEmail" TEXT NOT NULL,
    "actorAvatar" TEXT,
    "actionType" "ActivityLogActionType" NOT NULL,
    "actionLabel" TEXT NOT NULL,
    "moduleLabel" TEXT NOT NULL,
    "targetLabel" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "result" "ActivityLogResult" NOT NULL,
    "ipAddress" TEXT,
    "deviceLabel" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_userId_idx" ON "ActivityLog"("userId");

-- CreateIndex
CREATE INDEX "ActivityLog_actionType_idx" ON "ActivityLog"("actionType");

-- CreateIndex
CREATE INDEX "ActivityLog_moduleLabel_idx" ON "ActivityLog"("moduleLabel");

-- CreateIndex
CREATE INDEX "ActivityLog_result_idx" ON "ActivityLog"("result");

-- CreateIndex
CREATE INDEX "ActivityLog_createdAt_idx" ON "ActivityLog"("createdAt");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
