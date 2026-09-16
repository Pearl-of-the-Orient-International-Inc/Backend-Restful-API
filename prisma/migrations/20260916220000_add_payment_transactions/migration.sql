ALTER TYPE "ChaplainOrderPaymentStatus" ADD VALUE 'CANCELLED';
ALTER TYPE "ChaplainOrderPaymentStatus" ADD VALUE 'EXPIRED';

CREATE TYPE "PaymentGateway" AS ENUM ('XENDIT', 'PAYPAL');
CREATE TYPE "PaymentPurpose" AS ENUM ('CHAPLAIN_PRODUCT_ORDER', 'SERVICE_BOOKING', 'SEMINARY_FEE', 'OTHER');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELLED', 'EXPIRED', 'REFUNDED');

ALTER TABLE "ChaplainProductOrder"
ADD COLUMN "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

CREATE TABLE "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PHP',
  "purpose" "PaymentPurpose" NOT NULL,
  "payerReference" TEXT NOT NULL,
  "gateway" "PaymentGateway" NOT NULL,
  "gatewayReference" TEXT,
  "checkoutUrl" TEXT,
  "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "providerStatus" TEXT,
  "failureReason" TEXT,
  "metadata" JSONB,
  "paidAt" TIMESTAMP(3),
  "expiresAt" TIMESTAMP(3),
  "chaplainProductOrderId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PaymentTransaction_reference_key" ON "PaymentTransaction"("reference");
CREATE UNIQUE INDEX "PaymentTransaction_gatewayReference_key" ON "PaymentTransaction"("gatewayReference");
CREATE INDEX "PaymentTransaction_chaplainProductOrderId_idx" ON "PaymentTransaction"("chaplainProductOrderId");
CREATE INDEX "PaymentTransaction_gateway_idx" ON "PaymentTransaction"("gateway");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");
CREATE INDEX "PaymentTransaction_payerReference_idx" ON "PaymentTransaction"("payerReference");
CREATE INDEX "PaymentTransaction_createdAt_idx" ON "PaymentTransaction"("createdAt");

ALTER TABLE "PaymentTransaction"
ADD CONSTRAINT "PaymentTransaction_chaplainProductOrderId_fkey"
FOREIGN KEY ("chaplainProductOrderId") REFERENCES "ChaplainProductOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
