/*
  Warnings:

  - You are about to drop the column `title` on the `ShipImages` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ShipImages" DROP COLUMN "title",
ALTER COLUMN "alt" DROP NOT NULL;
