/*
  Warnings:

  - You are about to drop the column `duties` on the `Office` table. All the data in the column will be lost.
  - You are about to drop the column `responsibilities` on the `Office` table. All the data in the column will be lost.
  - Added the required column `sections` to the `Office` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Office" DROP COLUMN "duties",
DROP COLUMN "responsibilities",
ADD COLUMN     "sections" JSONB NOT NULL;
