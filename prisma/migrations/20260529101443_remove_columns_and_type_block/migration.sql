/*
  Warnings:

  - You are about to drop the column `columns` on the `PostBlock` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `PostBlock` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "PostBlock" DROP COLUMN "columns",
DROP COLUMN "type";

-- DropEnum
DROP TYPE "BlockType";
