/*
  Warnings:

  - Added the required column `senderEmail` to the `inquiry` table without a default value. This is not possible if the table is not empty.
  - Added the required column `senderName` to the `inquiry` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "inquiry" ADD COLUMN     "senderEmail" TEXT NOT NULL,
ADD COLUMN     "senderName" TEXT NOT NULL,
ADD COLUMN     "senderPhone" TEXT,
ALTER COLUMN "senderId" DROP NOT NULL;
