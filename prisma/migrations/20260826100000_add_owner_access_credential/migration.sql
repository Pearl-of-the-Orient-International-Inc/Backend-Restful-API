CREATE TABLE "OwnerAccessCredential" (
    "id" TEXT NOT NULL DEFAULT 'owner',
    "pinHash" TEXT NOT NULL,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OwnerAccessCredential_pkey" PRIMARY KEY ("id")
);
