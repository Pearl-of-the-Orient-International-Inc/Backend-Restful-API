-- CreateEnum
CREATE TYPE "BackupFrequency" AS ENUM ('HOURLY', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "BackupSnapshotSource" AS ENUM ('MANUAL', 'AUTOMATIC');

-- CreateEnum
CREATE TYPE "BackupSnapshotStatus" AS ENUM ('READY', 'IN_PROGRESS', 'FAILED');

-- CreateTable
CREATE TABLE "DatabaseBackupSettings" (
    "id" TEXT NOT NULL,
    "automaticBackupEnabled" BOOLEAN NOT NULL DEFAULT true,
    "frequency" "BackupFrequency" NOT NULL DEFAULT 'DAILY',
    "retentionDays" INTEGER NOT NULL DEFAULT 30,
    "nextRunAt" TIMESTAMP(3),
    "lastUpdatedByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseBackupSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DatabaseBackupSnapshot" (
    "id" TEXT NOT NULL,
    "fileKey" TEXT,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "source" "BackupSnapshotSource" NOT NULL DEFAULT 'MANUAL',
    "status" "BackupSnapshotStatus" NOT NULL DEFAULT 'READY',
    "sizeBytes" INTEGER NOT NULL,
    "tableCount" INTEGER NOT NULL,
    "retentionDays" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdByUserId" TEXT,
    "restoredAt" TIMESTAMP(3),
    "restoredByUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DatabaseBackupSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DatabaseBackupSnapshot_source_idx" ON "DatabaseBackupSnapshot"("source");

-- CreateIndex
CREATE INDEX "DatabaseBackupSnapshot_status_idx" ON "DatabaseBackupSnapshot"("status");

-- CreateIndex
CREATE INDEX "DatabaseBackupSnapshot_createdAt_idx" ON "DatabaseBackupSnapshot"("createdAt");

-- AddForeignKey
ALTER TABLE "DatabaseBackupSettings" ADD CONSTRAINT "DatabaseBackupSettings_lastUpdatedByUserId_fkey" FOREIGN KEY ("lastUpdatedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseBackupSnapshot" ADD CONSTRAINT "DatabaseBackupSnapshot_createdByUserId_fkey" FOREIGN KEY ("createdByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DatabaseBackupSnapshot" ADD CONSTRAINT "DatabaseBackupSnapshot_restoredByUserId_fkey" FOREIGN KEY ("restoredByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
