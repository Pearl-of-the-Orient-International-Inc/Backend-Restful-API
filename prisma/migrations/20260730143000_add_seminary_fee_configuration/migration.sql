-- CreateTable
CREATE TABLE "SeminaryFeeConfiguration" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "feeBreakdowns" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SeminaryFeeConfiguration_pkey" PRIMARY KEY ("id")
);
