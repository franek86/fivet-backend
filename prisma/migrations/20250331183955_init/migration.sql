/*
  Warnings:

  - You are about to drop the column `description` on the `AddressBook` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `AddressBook` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `AddressBook` table. All the data in the column will be lost.
  - You are about to drop the column `webUrl` on the `AddressBook` table. All the data in the column will be lost.
  - You are about to drop the column `multipleImages` on the `Ship` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `Ship` table. All the data in the column will be lost.
  - You are about to drop the column `singleImage` on the `Ship` table. All the data in the column will be lost.
  - Added the required column `address_2` to the `AddressBook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `country` to the `AddressBook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mobile_number` to the `AddressBook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `phone_number` to the `AddressBook` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lengthOverall` to the `Ship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `mainImage` to the `Ship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shipName` to the `Ship` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "AddressBook" DROP COLUMN "description",
DROP COLUMN "phone",
DROP COLUMN "status",
DROP COLUMN "webUrl",
ADD COLUMN     "address_2" TEXT NOT NULL,
ADD COLUMN     "country" TEXT NOT NULL,
ADD COLUMN     "facebook_link" TEXT,
ADD COLUMN     "instagram_link" TEXT,
ADD COLUMN     "linkedin_link" TEXT,
ADD COLUMN     "mobile_number" TEXT NOT NULL,
ADD COLUMN     "note" TEXT,
ADD COLUMN     "phone_number" TEXT NOT NULL,
ADD COLUMN     "proprity" "Status" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "tiktok_link" TEXT,
ADD COLUMN     "web_link" TEXT;

-- AlterTable
ALTER TABLE "Ship" DROP COLUMN "multipleImages",
DROP COLUMN "name",
DROP COLUMN "singleImage",
ADD COLUMN     "images" TEXT[],
ADD COLUMN     "lengthOverall" TEXT NOT NULL,
ADD COLUMN     "mainImage" TEXT NOT NULL,
ADD COLUMN     "shipName" TEXT NOT NULL,
ALTER COLUMN "cargoCapacity" SET DATA TYPE TEXT;
