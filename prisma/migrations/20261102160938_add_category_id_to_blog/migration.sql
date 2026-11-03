/*
  Warnings:

  - You are about to drop the `_PostToPostCategory` table. If the table is not empty, all the data it contains will be lost.
  - Made the column `order` on table `blogGallery` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `categoryId` to the `blogs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "_PostToPostCategory" DROP CONSTRAINT "_PostToPostCategory_A_fkey";

-- DropForeignKey
ALTER TABLE "_PostToPostCategory" DROP CONSTRAINT "_PostToPostCategory_B_fkey";

-- AlterTable
ALTER TABLE "blogGallery" ALTER COLUMN "order" SET NOT NULL,
ALTER COLUMN "order" SET DEFAULT 0;

-- AlterTable
ALTER TABLE "blogs" ADD COLUMN     "categoryId" TEXT NOT NULL;

-- DropTable
DROP TABLE "_PostToPostCategory";

-- CreateIndex
CREATE INDEX "blogs_categoryId_idx" ON "blogs"("categoryId");

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blogCategories"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
