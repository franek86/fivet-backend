/*
  Warnings:

  - The primary key for the `ShipImages` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "ShipImages" DROP CONSTRAINT "ShipImages_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ShipImages_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ShipImages_id_seq";
