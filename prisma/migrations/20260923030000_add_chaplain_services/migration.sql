CREATE TABLE "ChaplainService" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "availability" TEXT,
    "commissionPercent" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaplainService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChaplainService_name_key" ON "ChaplainService"("name");
CREATE INDEX "ChaplainService_isActive_idx" ON "ChaplainService"("isActive");
CREATE INDEX "ChaplainService_sortOrder_idx" ON "ChaplainService"("sortOrder");
