/*
  Warnings:

  - The primary key for the `AddressBook` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- AlterTable
ALTER TABLE "AddressBook" DROP CONSTRAINT "AddressBook_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "AddressBook_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "AddressBook_id_seq";
