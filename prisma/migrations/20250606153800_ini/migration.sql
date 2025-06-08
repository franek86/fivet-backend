/*
  Warnings:

  - You are about to drop the column `proprity` on the `AddressBook` table. All the data in the column will be lost.
  - Made the column `imo` on table `Ship` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `fullName` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AddressBook" DROP COLUMN "proprity",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "priority" "Status" NOT NULL DEFAULT 'REGULAR',
ALTER COLUMN "company" DROP NOT NULL,
ALTER COLUMN "address" DROP NOT NULL,
ALTER COLUMN "address_2" DROP NOT NULL,
ALTER COLUMN "country" DROP NOT NULL,
ALTER COLUMN "mobile_number" DROP NOT NULL,
ALTER COLUMN "phone_number" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Ship" ALTER COLUMN "imo" SET NOT NULL,
ALTER COLUMN "buildYear" DROP NOT NULL,
ALTER COLUMN "buildCountry" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "fullName" TEXT NOT NULL;
