/*
  Warnings:

  - The values [BASIC,VIP] on the enum `Subscription` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "Subscription_new" AS ENUM ('STARTER', 'STANDARD', 'PREMIUM');
ALTER TABLE "User" ALTER COLUMN "subscription" DROP DEFAULT;
ALTER TABLE "User" ALTER COLUMN "subscription" TYPE "Subscription_new" USING ("subscription"::text::"Subscription_new");
ALTER TYPE "Subscription" RENAME TO "Subscription_old";
ALTER TYPE "Subscription_new" RENAME TO "Subscription";
DROP TYPE "Subscription_old";
ALTER TABLE "User" ALTER COLUMN "subscription" SET DEFAULT 'STARTER';
COMMIT;

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "subscription" SET DEFAULT 'STARTER';
