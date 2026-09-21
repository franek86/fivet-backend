/*
  Warnings:

  - You are about to alter the column `price` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(15,2)`.
  - You are about to alter the column `lengthOverall` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `beam` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `draft` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - The `ddDueDate` column on the `ship` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to alter the column `dwt` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(8,2)`.
  - You are about to alter the column `grossTonnage` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - You are about to alter the column `netTonnage` on the `ship` table. The data in that column could be lost. The data in that column will be cast from `DoublePrecision` to `Decimal(12,2)`.
  - The `ssDueDate` column on the `ship` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "ship" ALTER COLUMN "price" SET DATA TYPE DECIMAL(15,2),
ALTER COLUMN "lengthOverall" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "beam" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "draft" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "currency" SET DEFAULT '$',
DROP COLUMN "ddDueDate",
ADD COLUMN     "ddDueDate" TIMESTAMP(3),
ALTER COLUMN "dwt" SET DATA TYPE DECIMAL(8,2),
ALTER COLUMN "grossTonnage" SET DATA TYPE DECIMAL(12,2),
ALTER COLUMN "netTonnage" SET DATA TYPE DECIMAL(12,2),
DROP COLUMN "ssDueDate",
ADD COLUMN     "ssDueDate" TIMESTAMP(3);
