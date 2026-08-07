-- CreateEnum
CREATE TYPE "ReceiptOrganization" AS ENUM ('POILE', 'POTSCI', 'PEARL_CHAPLAINCY');

-- CreateEnum
CREATE TYPE "ReceiptPaymentType" AS ENUM ('CASH', 'CHECK');

-- CreateTable
CREATE TABLE "AccountingAcknowledgementReceipt" (
    "id" TEXT NOT NULL,
    "receiptNo" TEXT NOT NULL,
    "organization" "ReceiptOrganization" NOT NULL,
    "name" TEXT NOT NULL,
    "receiptDate" TIMESTAMP(3) NOT NULL,
    "course" TEXT,
    "school" TEXT,
    "paymentType" "ReceiptPaymentType" NOT NULL DEFAULT 'CASH',
    "checkNo" TEXT,
    "cashier" TEXT,
    "remarks" TEXT,
    "totalAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAcknowledgementReceipt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AccountingAcknowledgementReceiptItem" (
    "id" TEXT NOT NULL,
    "particulars" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "remarks" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "receiptId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingAcknowledgementReceiptItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingAcknowledgementReceipt_receiptNo_key" ON "AccountingAcknowledgementReceipt"("receiptNo");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceipt_receiptNo_idx" ON "AccountingAcknowledgementReceipt"("receiptNo");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceipt_organization_idx" ON "AccountingAcknowledgementReceipt"("organization");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceipt_name_idx" ON "AccountingAcknowledgementReceipt"("name");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceipt_receiptDate_idx" ON "AccountingAcknowledgementReceipt"("receiptDate");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceipt_createdAt_idx" ON "AccountingAcknowledgementReceipt"("createdAt");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceiptItem_receiptId_idx" ON "AccountingAcknowledgementReceiptItem"("receiptId");

-- CreateIndex
CREATE INDEX "AccountingAcknowledgementReceiptItem_sortOrder_idx" ON "AccountingAcknowledgementReceiptItem"("sortOrder");

-- AddForeignKey
ALTER TABLE "AccountingAcknowledgementReceiptItem" ADD CONSTRAINT "AccountingAcknowledgementReceiptItem_receiptId_fkey" FOREIGN KEY ("receiptId") REFERENCES "AccountingAcknowledgementReceipt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
