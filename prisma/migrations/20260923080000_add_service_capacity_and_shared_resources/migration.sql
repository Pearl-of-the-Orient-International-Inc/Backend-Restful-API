ALTER TABLE "ChaplainService"
ADD COLUMN "maxConcurrentBookings" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN "sharedResourceName" TEXT,
ADD COLUMN "sharedResourceKey" TEXT,
ADD COLUMN "sharedResourceCapacity" INTEGER;

CREATE INDEX "ChaplainService_sharedResourceKey_idx"
ON "ChaplainService"("sharedResourceKey");
