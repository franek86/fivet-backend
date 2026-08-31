/*
  Warnings:

  - You are about to drop the column `legaleName` on the `company` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "company" DROP COLUMN "legaleName",
ADD COLUMN     "legalName" TEXT,
ADD COLUMN     "vat" TEXT;
