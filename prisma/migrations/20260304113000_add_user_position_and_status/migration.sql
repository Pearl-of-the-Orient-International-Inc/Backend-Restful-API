-- CreateEnum
CREATE TYPE "UserPosition" AS ENUM ('CLERK', 'HR', 'IT', 'ACCOUNTING_FINANCE', 'OPERATIONS', 'SECRETARIAT');

-- CreateEnum
CREATE TYPE "UserAccountStatus" AS ENUM ('ACTIVE', 'PENDING', 'SUSPENDED');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "position" "UserPosition",
ADD COLUMN "accountStatus" "UserAccountStatus" NOT NULL DEFAULT 'ACTIVE';
