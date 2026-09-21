/*
  Warnings:

  - You are about to drop the column `depth` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `flagState` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `hullMaterial` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `latitude` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `length` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `location` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `refitYear` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `remarks` on the `ship` table. All the data in the column will be lost.
  - You are about to drop the column `tonnage` on the `ship` table. All the data in the column will be lost.
  - Added the required column `dwt` to the `ship` table without a default value. This is not possible if the table is not empty.
  - Made the column `typeId` on table `ship` required. This step will fail if there are existing NULL values in that column.
  - Made the column `buildYear` on table `ship` required. This step will fail if there are existing NULL values in that column.
  - Made the column `lengthOverall` on table `ship` required. This step will fail if there are existing NULL values in that column.
  - Made the column `beam` on table `ship` required. This step will fail if there are existing NULL values in that column.
  - Made the column `draft` on table `ship` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "ship" DROP COLUMN "depth",
DROP COLUMN "flagState",
DROP COLUMN "hullMaterial",
DROP COLUMN "latitude",
DROP COLUMN "length",
DROP COLUMN "location",
DROP COLUMN "longitude",
DROP COLUMN "refitYear",
DROP COLUMN "remarks",
DROP COLUMN "tonnage",
ADD COLUMN     "classNotation" TEXT,
ADD COLUMN     "cruisingSpeed" DOUBLE PRECISION,
ADD COLUMN     "currentPort" TEXT,
ADD COLUMN     "ddDueDate" TEXT,
ADD COLUMN     "dwt" DOUBLE PRECISION NOT NULL,
ADD COLUMN     "enginePower" TEXT,
ADD COLUMN     "flag" TEXT,
ADD COLUMN     "grossTonnage" DOUBLE PRECISION,
ADD COLUMN     "netTonnage" DOUBLE PRECISION,
ADD COLUMN     "ssDueDate" TEXT,
ALTER COLUMN "typeId" SET NOT NULL,
ALTER COLUMN "buildYear" SET NOT NULL,
ALTER COLUMN "lengthOverall" SET NOT NULL,
ALTER COLUMN "beam" SET NOT NULL,
ALTER COLUMN "draft" SET NOT NULL;
