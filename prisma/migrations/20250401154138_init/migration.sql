/*
  Warnings:

  - The primary key for the `Ship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `ShipType` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_typeId_fkey";

-- AlterTable
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ALTER COLUMN "typeId" SET DATA TYPE TEXT,
ADD CONSTRAINT "Ship_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "Ship_id_seq";

-- AlterTable
ALTER TABLE "ShipType" DROP CONSTRAINT "ShipType_pkey",
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "ShipType_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "ShipType_id_seq";

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ShipType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
