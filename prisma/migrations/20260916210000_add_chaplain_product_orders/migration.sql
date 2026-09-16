-- CreateEnum
CREATE TYPE "ChaplainOrderFulfillmentMethod" AS ENUM ('DELIVERY', 'PICKUP');
CREATE TYPE "ChaplainOrderPaymentMethod" AS ENUM ('CASH', 'ONLINE');
CREATE TYPE "ChaplainOrderPaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "ChaplainOrderStatus" AS ENUM ('PENDING', 'PAID', 'PROCESSING', 'READY', 'COMPLETED', 'CANCELLED', 'REFUNDED');

-- CreateTable
CREATE TABLE "ChaplainProductOrder" (
    "id" TEXT NOT NULL,
    "orderNumber" TEXT NOT NULL,
    "checkoutToken" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unitPrice" DECIMAL(10,2) NOT NULL,
    "subtotal" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "customerUserId" TEXT,
    "customerName" TEXT NOT NULL,
    "customerEmail" TEXT NOT NULL,
    "customerPhone" TEXT NOT NULL,
    "fulfillmentMethod" "ChaplainOrderFulfillmentMethod" NOT NULL,
    "deliveryAddress" TEXT,
    "customerNotes" TEXT,
    "paymentMethod" "ChaplainOrderPaymentMethod" NOT NULL,
    "paymentStatus" "ChaplainOrderPaymentStatus" NOT NULL DEFAULT 'PENDING',
    "paymentGateway" TEXT,
    "providerCheckoutId" TEXT,
    "providerCheckoutUrl" TEXT,
    "status" "ChaplainOrderStatus" NOT NULL DEFAULT 'PENDING',
    "inventoryReleasedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChaplainProductOrder_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ChaplainProductOrder_orderNumber_key" ON "ChaplainProductOrder"("orderNumber");
CREATE UNIQUE INDEX "ChaplainProductOrder_checkoutToken_key" ON "ChaplainProductOrder"("checkoutToken");
CREATE INDEX "ChaplainProductOrder_productId_idx" ON "ChaplainProductOrder"("productId");
CREATE INDEX "ChaplainProductOrder_customerUserId_idx" ON "ChaplainProductOrder"("customerUserId");
CREATE INDEX "ChaplainProductOrder_customerEmail_idx" ON "ChaplainProductOrder"("customerEmail");
CREATE INDEX "ChaplainProductOrder_status_idx" ON "ChaplainProductOrder"("status");
CREATE INDEX "ChaplainProductOrder_paymentStatus_idx" ON "ChaplainProductOrder"("paymentStatus");
CREATE INDEX "ChaplainProductOrder_createdAt_idx" ON "ChaplainProductOrder"("createdAt");

ALTER TABLE "ChaplainProductOrder" ADD CONSTRAINT "ChaplainProductOrder_productId_fkey" FOREIGN KEY ("productId") REFERENCES "ChaplainProduct"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChaplainProductOrder" ADD CONSTRAINT "ChaplainProductOrder_customerUserId_fkey" FOREIGN KEY ("customerUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
