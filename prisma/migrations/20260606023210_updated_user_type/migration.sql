/*
  Warnings:

  - The values [SECRETARIAT] on the enum `UserPosition` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserPosition_new" AS ENUM ('CLERK', 'REGISTRAR', 'HR', 'IT', 'ACCOUNTING_FINANCE', 'OPERATIONS', 'SECRETARIAN');
ALTER TABLE "User" ALTER COLUMN "position" TYPE "UserPosition_new" USING ("position"::text::"UserPosition_new");
ALTER TYPE "UserPosition" RENAME TO "UserPosition_old";
ALTER TYPE "UserPosition_new" RENAME TO "UserPosition";
DROP TYPE "public"."UserPosition_old";
COMMIT;
