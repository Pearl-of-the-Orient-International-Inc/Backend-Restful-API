/*
  Warnings:

  - The values [SUPERADMIN] on the enum `UserType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "UserType_new" AS ENUM ('MEMBER', 'ADMIN');
ALTER TABLE "User" ALTER COLUMN "role" TYPE "UserType_new" USING ("role"::text::"UserType_new");
ALTER TYPE "UserType" RENAME TO "UserType_old";
ALTER TYPE "UserType_new" RENAME TO "UserType";
DROP TYPE "public"."UserType_old";
COMMIT;
