CREATE TYPE "ChaplainServiceDeliveryMethod" AS ENUM ('ON_SITE', 'ONLINE', 'PHONE');
CREATE TYPE "ChaplainServiceBookingStatus" AS ENUM ('PENDING', 'CONFIRMED', 'RESCHEDULED', 'REJECTED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "ChaplainServicePaymentStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "ChaplainServiceCommissionStatus" AS ENUM ('NOT_APPLICABLE', 'PENDING', 'SETTLED', 'WAIVED');

CREATE TABLE "ChaplainServiceBooking" (
  "id" TEXT NOT NULL,
  "serviceId" TEXT NOT NULL,
  "providerMemberId" TEXT NOT NULL,
  "requesterUserId" TEXT,
  "requesterName" TEXT NOT NULL,
  "requesterEmail" TEXT NOT NULL,
  "requesterPhone" TEXT NOT NULL,
  "preferredAt" TIMESTAMP(3) NOT NULL,
  "deliveryMethod" "ChaplainServiceDeliveryMethod" NOT NULL,
  "locationDetails" TEXT NOT NULL,
  "notes" TEXT,
  "status" "ChaplainServiceBookingStatus" NOT NULL DEFAULT 'PENDING',
  "statusReason" TEXT,
  "providerServiceFee" DECIMAL(12,2),
  "providerCommissionAmount" DECIMAL(12,2),
  "providerCommissionStatus" "ChaplainServiceCommissionStatus" NOT NULL DEFAULT 'NOT_APPLICABLE',
  "requesterPaymentStatus" "ChaplainServicePaymentStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ChaplainServiceBooking_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ChaplainServiceBookingStatusHistory" (
  "id" TEXT NOT NULL,
  "bookingId" TEXT NOT NULL,
  "status" "ChaplainServiceBookingStatus" NOT NULL,
  "reason" TEXT,
  "changedByUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ChaplainServiceBookingStatusHistory_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "ChaplainServiceBooking" ADD CONSTRAINT "ChaplainServiceBooking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "ChaplainService"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChaplainServiceBooking" ADD CONSTRAINT "ChaplainServiceBooking_providerMemberId_fkey" FOREIGN KEY ("providerMemberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ChaplainServiceBooking" ADD CONSTRAINT "ChaplainServiceBooking_requesterUserId_fkey" FOREIGN KEY ("requesterUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ChaplainServiceBookingStatusHistory" ADD CONSTRAINT "ChaplainServiceBookingStatusHistory_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "ChaplainServiceBooking"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE INDEX "ChaplainServiceBooking_serviceId_idx" ON "ChaplainServiceBooking"("serviceId");
CREATE INDEX "ChaplainServiceBooking_providerMemberId_preferredAt_idx" ON "ChaplainServiceBooking"("providerMemberId", "preferredAt");
CREATE INDEX "ChaplainServiceBooking_requesterUserId_idx" ON "ChaplainServiceBooking"("requesterUserId");
CREATE INDEX "ChaplainServiceBooking_status_idx" ON "ChaplainServiceBooking"("status");
CREATE INDEX "ChaplainServiceBookingStatusHistory_bookingId_createdAt_idx" ON "ChaplainServiceBookingStatusHistory"("bookingId", "createdAt");
