-- CreateEnum
CREATE TYPE "AccountingLedgerTransactionType" AS ENUM ('INCOME', 'EXPENSE', 'PAYABLE', 'RECEIVABLE');

-- CreateEnum
CREATE TYPE "AccountingLedgerTransactionStatus" AS ENUM ('PAID', 'RECEIVED', 'UNPAID', 'PENDING', 'VOID');

-- CreateTable
CREATE TABLE "AccountingLedgerTransaction" (
    "id" TEXT NOT NULL,
    "transactionNo" TEXT NOT NULL,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "type" "AccountingLedgerTransactionType" NOT NULL,
    "party" TEXT NOT NULL,
    "note" TEXT,
    "account" TEXT NOT NULL,
    "accountNo" TEXT,
    "category" TEXT NOT NULL,
    "debit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "credit" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "status" "AccountingLedgerTransactionStatus" NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AccountingLedgerTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AccountingLedgerTransaction_transactionNo_key" ON "AccountingLedgerTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_transactionNo_idx" ON "AccountingLedgerTransaction"("transactionNo");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_transactionDate_idx" ON "AccountingLedgerTransaction"("transactionDate");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_type_idx" ON "AccountingLedgerTransaction"("type");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_status_idx" ON "AccountingLedgerTransaction"("status");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_category_idx" ON "AccountingLedgerTransaction"("category");

-- CreateIndex
CREATE INDEX "AccountingLedgerTransaction_createdAt_idx" ON "AccountingLedgerTransaction"("createdAt");
