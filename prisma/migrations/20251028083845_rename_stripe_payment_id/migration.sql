/*
  Warnings:

  - You are about to drop the column `sripePaymentId` on the `Payment` table. All the data in the column will be lost.
  - Added the required column `stripePaymentId` to the `Payment` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Payment" DROP COLUMN "sripePaymentId",
ADD COLUMN     "stripePaymentId" TEXT NOT NULL;
