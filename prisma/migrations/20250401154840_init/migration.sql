/*
  Warnings:

  - Made the column `typeId` on table `Ship` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_typeId_fkey";

-- AlterTable
ALTER TABLE "Ship" ALTER COLUMN "typeId" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ShipType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
