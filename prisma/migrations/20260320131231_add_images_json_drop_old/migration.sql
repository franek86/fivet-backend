/*
  Warnings:

  - You are about to drop the column `imagesJson` on the `Ship` table. All the data in the column will be lost.
  - The `images` column on the `Ship` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Ship" DROP COLUMN "imagesJson",
DROP COLUMN "images",
ADD COLUMN     "images" JSONB;
