/*
  Warnings:

  - Added the required column `type` to the `PostBlock` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "PostBlock" ADD COLUMN     "columns" JSONB,
ADD COLUMN     "type" TEXT NOT NULL;
