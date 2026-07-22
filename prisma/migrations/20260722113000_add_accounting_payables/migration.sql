-- CreateEnum
CREATE TYPE "AccountingPayableStatus" AS ENUM ('DRAFT', 'OPEN', 'DUE_SOON', 'OVERDUE', 'PARTIAL', 'PAID', 'CANCELLED');

-- CreateTable
CREATE TABLE "AccountingPayable" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "paymentTerms" TEXT,
    "paymentMethod" TEXT,
    "bankAccount" TEXT,
    "remarks" TEXT,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AccountingPayableStatus" NOT NULL DEFAULT 'OPEN',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPayable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingPayableItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unitCost" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "payableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingPayableItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingPayable_billNo_key" ON "AccountingPayable"("billNo");

-- CreateIndex
CREATE INDEX "AccountingPayable_billNo_idx" ON "AccountingPayable"("billNo");

-- CreateIndex
CREATE INDEX "AccountingPayable_supplier_idx" ON "AccountingPayable"("supplier");

-- CreateIndex
CREATE INDEX "AccountingPayable_category_idx" ON "AccountingPayable"("category");

-- CreateIndex
CREATE INDEX "AccountingPayable_billDate_idx" ON "AccountingPayable"("billDate");

-- CreateIndex
CREATE INDEX "AccountingPayable_dueDate_idx" ON "AccountingPayable"("dueDate");

-- CreateIndex
CREATE INDEX "AccountingPayable_status_idx" ON "AccountingPayable"("status");

-- CreateIndex
CREATE INDEX "AccountingPayable_createdAt_idx" ON "AccountingPayable"("createdAt");

-- CreateIndex
CREATE INDEX "AccountingPayableItem_payableId_idx" ON "AccountingPayableItem"("payableId");

-- CreateIndex
CREATE INDEX "AccountingPayableItem_sortOrder_idx" ON "AccountingPayableItem"("sortOrder");

-- AddForeignKey
ALTER TABLE "AccountingPayableItem" ADD CONSTRAINT "AccountingPayableItem_payableId_fkey" FOREIGN KEY ("payableId") REFERENCES "AccountingPayable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
