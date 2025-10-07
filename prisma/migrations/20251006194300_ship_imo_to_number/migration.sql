/*
  Warnings:

  - Changed the type of `imo` on the `Ship` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "Ship" DROP COLUMN "imo",
ADD COLUMN     "imo" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Ship_imo_key" ON "Ship"("imo");
