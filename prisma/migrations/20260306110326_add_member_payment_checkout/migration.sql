-- CreateEnum
CREATE TYPE "MemberPaymentMethod" AS ENUM ('E_WALLET', 'DIRECT_DEBIT', 'OVER_THE_COUNTER', 'CASH');

-- CreateTable
CREATE TABLE "MemberPaymentCheckout" (
    "id" TEXT NOT NULL,
    "paymentMethod" "MemberPaymentMethod" NOT NULL,
    "proofOfPaymentUrl" TEXT,
    "isPromissoryNote" BOOLEAN NOT NULL DEFAULT false,
    "promissoryNoteUrl" TEXT,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "memberId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MemberPaymentCheckout_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MemberPaymentCheckout_memberId_key" ON "MemberPaymentCheckout"("memberId");

-- AddForeignKey
ALTER TABLE "MemberPaymentCheckout" ADD CONSTRAINT "MemberPaymentCheckout_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
