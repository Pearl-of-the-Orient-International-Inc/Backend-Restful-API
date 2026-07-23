-- CreateEnum
CREATE TYPE "AccountingReceivableStatus" AS ENUM ('DRAFT', 'UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateTable
CREATE TABLE "AccountingReceivable" (
    "id" TEXT NOT NULL,
    "invoiceNo" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "invoiceDate" TIMESTAMP(3) NOT NULL,
    "dueDate" TIMESTAMP(3) NOT NULL,
    "reference" TEXT,
    "description" TEXT,
    "paymentTerms" TEXT,
    "paymentMethod" TEXT,
    "bankAccount" TEXT,
    "notes" TEXT,
    "discount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "tax" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AccountingReceivableStatus" NOT NULL DEFAULT 'UNPAID',
    "attachments" JSONB NOT NULL DEFAULT '[]',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingReceivable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingReceivableItem" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "account" TEXT,
    "quantity" DECIMAL(12,2) NOT NULL DEFAULT 1,
    "unitPrice" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "receivableId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingReceivableItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingReceivable_invoiceNo_key" ON "AccountingReceivable"("invoiceNo");

-- CreateIndex
CREATE INDEX "AccountingReceivable_invoiceNo_idx" ON "AccountingReceivable"("invoiceNo");

-- CreateIndex
CREATE INDEX "AccountingReceivable_customer_idx" ON "AccountingReceivable"("customer");

-- CreateIndex
CREATE INDEX "AccountingReceivable_invoiceDate_idx" ON "AccountingReceivable"("invoiceDate");

-- CreateIndex
CREATE INDEX "AccountingReceivable_dueDate_idx" ON "AccountingReceivable"("dueDate");

-- CreateIndex
CREATE INDEX "AccountingReceivable_status_idx" ON "AccountingReceivable"("status");

-- CreateIndex
CREATE INDEX "AccountingReceivable_createdAt_idx" ON "AccountingReceivable"("createdAt");

-- CreateIndex
CREATE INDEX "AccountingReceivableItem_receivableId_idx" ON "AccountingReceivableItem"("receivableId");

-- CreateIndex
CREATE INDEX "AccountingReceivableItem_sortOrder_idx" ON "AccountingReceivableItem"("sortOrder");

-- AddForeignKey
ALTER TABLE "AccountingReceivableItem" ADD CONSTRAINT "AccountingReceivableItem_receivableId_fkey" FOREIGN KEY ("receivableId") REFERENCES "AccountingReceivable"("id") ON DELETE CASCADE ON UPDATE CASCADE;
