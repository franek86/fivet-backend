-- AlterTable
ALTER TABLE "user" ADD COLUMN     "avatarPublicId" TEXT,
ADD COLUMN     "frozenAt" TIMESTAMP(3),
ADD COLUMN     "isFrozen" BOOLEAN NOT NULL DEFAULT false;
