/*
  Warnings:

  - You are about to drop the column `imageIds` on the `Ship` table. All the data in the column will be lost.
  - You are about to drop the column `images` on the `Ship` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Ship" DROP COLUMN "imageIds",
DROP COLUMN "images";

-- CreateTable
CREATE TABLE "ShipImages" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "alt" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "shipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipImages_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ShipImages" ADD CONSTRAINT "ShipImages_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "Ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
