/*
  Warnings:

  - The primary key for the `blogCategories` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `categoryId` on the `blogs` table. All the data in the column will be lost.
  - You are about to drop the `blogBlock` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[title]` on the table `blogCategories` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `blogCategories` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `slug` to the `blogCategories` table without a default value. This is not possible if the table is not empty.
  - Added the required column `content` to the `blogs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "blogBlock" DROP CONSTRAINT "blogBlock_postId_fkey";

-- DropForeignKey
ALTER TABLE "blogs" DROP CONSTRAINT "blogs_categoryId_fkey";

-- DropIndex
DROP INDEX "blogs_slug_idx";

-- DropIndex
DROP INDEX "blogs_status_idx";

-- AlterTable
ALTER TABLE "blogCategories" DROP CONSTRAINT "blogCategories_pkey",
ADD COLUMN     "slug" TEXT NOT NULL,
ALTER COLUMN "id" DROP DEFAULT,
ALTER COLUMN "id" SET DATA TYPE TEXT,
ADD CONSTRAINT "blogCategories_pkey" PRIMARY KEY ("id");
DROP SEQUENCE "blogCategories_id_seq";

-- AlterTable
ALTER TABLE "blogs" DROP COLUMN "categoryId",
ADD COLUMN     "content" TEXT NOT NULL,
ALTER COLUMN "slug" SET DEFAULT 'blog-slug',
ALTER COLUMN "readingTime" SET DEFAULT 1;

-- DropTable
DROP TABLE "blogBlock";

-- CreateTable
CREATE TABLE "_PostToPostCategory" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_PostToPostCategory_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_PostToPostCategory_B_index" ON "_PostToPostCategory"("B");

-- CreateIndex
CREATE UNIQUE INDEX "blogCategories_title_key" ON "blogCategories"("title");

-- CreateIndex
CREATE UNIQUE INDEX "blogCategories_slug_key" ON "blogCategories"("slug");

-- CreateIndex
CREATE INDEX "blogGallery_postId_idx" ON "blogGallery"("postId");

-- CreateIndex
CREATE INDEX "blogs_slug_status_publishedAt_idx" ON "blogs"("slug", "status", "publishedAt");

-- AddForeignKey
ALTER TABLE "_PostToPostCategory" ADD CONSTRAINT "_PostToPostCategory_A_fkey" FOREIGN KEY ("A") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_PostToPostCategory" ADD CONSTRAINT "_PostToPostCategory_B_fkey" FOREIGN KEY ("B") REFERENCES "blogCategories"("id") ON DELETE CASCADE ON UPDATE CASCADE;
