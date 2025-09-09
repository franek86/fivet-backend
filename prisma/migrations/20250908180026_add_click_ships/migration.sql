/*
  Warnings:

  - You are about to drop the `AdminDashboard` table. If the table is not empty, all the data it contains will be lost.

*/
-- AlterTable
ALTER TABLE "Ship" ADD COLUMN     "clicks" INTEGER NOT NULL DEFAULT 0;

-- DropTable
DROP TABLE "AdminDashboard";
