/*
  Warnings:

  - You are about to drop the `ShipImage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ShipImage" DROP CONSTRAINT "ShipImage_shipId_fkey";

-- AlterTable
ALTER TABLE "Ship" ADD COLUMN     "images" TEXT[];

-- DropTable
DROP TABLE "ShipImage";
