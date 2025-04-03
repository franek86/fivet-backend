-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_typeId_fkey";

-- DropForeignKey
ALTER TABLE "Ship" DROP CONSTRAINT "Ship_userId_fkey";

-- AlterTable
ALTER TABLE "Ship" ALTER COLUMN "typeId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "ShipType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ship" ADD CONSTRAINT "Ship_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
