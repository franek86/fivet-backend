-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'BROKER', 'OWNER', 'BUYER');

-- CreateEnum
CREATE TYPE "Subscription" AS ENUM ('STARTER', 'STANDARD', 'PREMIUM');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('IMPORTANT', 'REGULAR');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('PLANNED', 'CANCELLED', 'DONE');

-- CreateEnum
CREATE TYPE "EventPriority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('INFO', 'ALERT', 'REMINDER');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'FAILED', 'CANCELED');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED', 'SUSPENDED');

-- CreateEnum
CREATE TYPE "ListingStatus" AS ENUM ('PENDING', 'VERIFIED', 'REJECTED');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'REVOKED');

-- CreateEnum
CREATE TYPE "InquiryStatus" AS ENUM ('OPEN', 'RESPONDED', 'CLOSED');

-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'BUYER',
    "subscription" "Subscription" NOT NULL DEFAULT 'STARTER',
    "isActiveSubscription" BOOLEAN NOT NULL DEFAULT false,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "verifyPayment" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "address" TEXT,
    "zipCode" TEXT,
    "city" TEXT,
    "country" TEXT,
    "avatar" TEXT,
    "companyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "company" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legaleName" TEXT,
    "website" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT,
    "description" TEXT,
    "logo" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "company_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "description" TEXT,
    "yearsExperience" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ownerProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "verificationStatus" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "documentUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ownerProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ship" (
    "id" TEXT NOT NULL,
    "shipName" TEXT NOT NULL,
    "slug" TEXT NOT NULL DEFAULT 'default-slug',
    "typeId" TEXT,
    "imo" INTEGER NOT NULL,
    "refitYear" INTEGER,
    "buildYear" INTEGER,
    "price" DOUBLE PRECISION NOT NULL,
    "location" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "mainEngine" TEXT,
    "lengthOverall" DOUBLE PRECISION,
    "beam" DOUBLE PRECISION,
    "length" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "draft" DOUBLE PRECISION,
    "tonnage" DOUBLE PRECISION,
    "cargoCapacity" TEXT,
    "buildCountry" TEXT,
    "hullMaterial" TEXT,
    "remarks" TEXT,
    "description" TEXT,
    "flagState" TEXT,
    "isFeatured" BOOLEAN DEFAULT false,
    "currency" TEXT DEFAULT 'USD',
    "vatPaid" BOOLEAN,
    "fuelType" TEXT,
    "mainImage" TEXT,
    "mainImageAlt" TEXT,
    "mainImagePublicId" TEXT,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "listedById" TEXT NOT NULL,
    "ownerId" TEXT,
    "listingStatus" "ListingStatus" NOT NULL DEFAULT 'PENDING',
    "verifiedAt" TIMESTAMP(3),
    "verifiedBy" TEXT,
    "rejectionReason" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipImages" (
    "id" TEXT NOT NULL,
    "alt" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "shipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipImages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shipType" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "shipType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "addressBook" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone_number" TEXT,
    "mobile_number" TEXT,
    "country" TEXT,
    "address_2" TEXT,
    "web_link" TEXT,
    "linkedin_link" TEXT,
    "facebook_link" TEXT,
    "instagram_link" TEXT,
    "tiktok_link" TEXT,
    "priority" "Status" NOT NULL DEFAULT 'REGULAR',
    "company" TEXT,
    "address" TEXT,
    "note" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addressBook_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "events" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "start" TIMESTAMP(3) NOT NULL,
    "end" TIMESTAMP(3) NOT NULL,
    "location" TEXT,
    "reminder" INTEGER,
    "status" "EventStatus" DEFAULT 'PLANNED',
    "priority" "EventPriority" DEFAULT 'MEDIUM',
    "tags" TEXT[],
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" SERIAL NOT NULL,
    "message" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL DEFAULT 'INFO',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'EUR',
    "stripePaymentId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogs" (
    "id" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "subTitle" TEXT,
    "shortDescription" TEXT,
    "slug" TEXT NOT NULL DEFAULT 'post-slug',
    "status" "PostStatus" NOT NULL DEFAULT 'DRAFT',
    "categoryId" INTEGER,
    "tags" TEXT[],
    "bannerImage" TEXT,
    "bannerPublicId" TEXT,
    "bannerImageAlt" TEXT,
    "publishedAt" TIMESTAMP(3),
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "ogImage" TEXT,
    "canonicalUrl" TEXT,
    "readingTime" INTEGER,
    "views" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogBlock" (
    "id" TEXT NOT NULL,
    "postId" TEXT NOT NULL,
    "text" TEXT,
    "imageUrl" TEXT,
    "imageAlt" TEXT,
    "blockImagePublicId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blogBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogGallery" (
    "id" TEXT NOT NULL,
    "alt" TEXT,
    "url" TEXT NOT NULL,
    "publicId" TEXT,
    "postId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blogGallery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "blogCategories" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "blogCategories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokerAssignment" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorites" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "favorites_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savedSearch" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "filters" JSONB NOT NULL,
    "notifyOnMatch" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "savedSearch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inquiry" (
    "id" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "recipientId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "InquiryStatus" NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "inquiry_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "otp_email_key" ON "otp"("email");

-- CreateIndex
CREATE UNIQUE INDEX "brokerProfile_userId_key" ON "brokerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ownerProfile_userId_key" ON "ownerProfile"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "ship_slug_key" ON "ship"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "ship_imo_key" ON "ship"("imo");

-- CreateIndex
CREATE INDEX "ship_isPublished_listingStatus_idx" ON "ship"("isPublished", "listingStatus");

-- CreateIndex
CREATE INDEX "ship_typeId_idx" ON "ship"("typeId");

-- CreateIndex
CREATE INDEX "ship_price_idx" ON "ship"("price");

-- CreateIndex
CREATE INDEX "ship_listedById_idx" ON "ship"("listedById");

-- CreateIndex
CREATE INDEX "ship_ownerId_idx" ON "ship"("ownerId");

-- CreateIndex
CREATE UNIQUE INDEX "shipType_name_key" ON "shipType"("name");

-- CreateIndex
CREATE INDEX "payments_status_createdAt_idx" ON "payments"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "blogs_slug_key" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_slug_idx" ON "blogs"("slug");

-- CreateIndex
CREATE INDEX "blogs_status_idx" ON "blogs"("status");

-- CreateIndex
CREATE INDEX "blogBlock_postId_idx" ON "blogBlock"("postId");

-- CreateIndex
CREATE UNIQUE INDEX "brokerAssignment_ownerId_brokerId_key" ON "brokerAssignment"("ownerId", "brokerId");

-- CreateIndex
CREATE UNIQUE INDEX "favorites_userId_shipId_key" ON "favorites"("userId", "shipId");

-- CreateIndex
CREATE INDEX "inquiry_shipId_idx" ON "inquiry"("shipId");

-- CreateIndex
CREATE INDEX "inquiry_recipientId_status_idx" ON "inquiry"("recipientId", "status");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerProfile" ADD CONSTRAINT "brokerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ownerProfile" ADD CONSTRAINT "ownerProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ship" ADD CONSTRAINT "ship_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "shipType"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ship" ADD CONSTRAINT "ship_listedById_fkey" FOREIGN KEY ("listedById") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ship" ADD CONSTRAINT "ship_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "shipImages" ADD CONSTRAINT "shipImages_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "addressBook" ADD CONSTRAINT "addressBook_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "events" ADD CONSTRAINT "events_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogs" ADD CONSTRAINT "blogs_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "blogCategories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogBlock" ADD CONSTRAINT "blogBlock_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "blogGallery" ADD CONSTRAINT "blogGallery_postId_fkey" FOREIGN KEY ("postId") REFERENCES "blogs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerAssignment" ADD CONSTRAINT "brokerAssignment_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerAssignment" ADD CONSTRAINT "brokerAssignment_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorites" ADD CONSTRAINT "favorites_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savedSearch" ADD CONSTRAINT "savedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inquiry" ADD CONSTRAINT "inquiry_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
