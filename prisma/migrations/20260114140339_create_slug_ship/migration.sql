/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `Otp` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[slug]` on the table `Ship` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ship" ADD COLUMN     "slug" TEXT NOT NULL DEFAULT 'default-slug';

-- CreateIndex
CREATE UNIQUE INDEX "Otp_email_key" ON "Otp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Ship_slug_key" ON "Ship"("slug");
