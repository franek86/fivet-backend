-- AlterTable
ALTER TABLE "blogs" ALTER COLUMN "metaKeywords" DROP NOT NULL,
ALTER COLUMN "metaKeywords" SET DATA TYPE TEXT;
