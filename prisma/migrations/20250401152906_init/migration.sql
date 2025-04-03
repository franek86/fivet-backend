-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_typeId_fkey";

-- AlterTable
ALTER TABLE "Ship" ALTER COLUMN "typeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ShipType"("id") ON DELETE SET NULL ON UPDATE CASCADE;
