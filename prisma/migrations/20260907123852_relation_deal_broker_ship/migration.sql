-- CreateEnum
CREATE TYPE "DealStatus" AS ENUM ('NEGOTIATING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "BrokerRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "deal" (
    "id" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "brokerRequestId" TEXT,
    "status" "DealStatus" NOT NULL DEFAULT 'NEGOTIATING',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "deal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brokerRequest" (
    "id" TEXT NOT NULL,
    "brokerId" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "shipId" TEXT NOT NULL,
    "status" "BrokerRequestStatus" NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brokerRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "deal_brokerRequestId_key" ON "deal"("brokerRequestId");

-- CreateIndex
CREATE INDEX "deal_ownerId_status_idx" ON "deal"("ownerId", "status");

-- CreateIndex
CREATE INDEX "deal_brokerId_status_idx" ON "deal"("brokerId", "status");

-- CreateIndex
CREATE INDEX "deal_shipId_status_idx" ON "deal"("shipId", "status");

-- CreateIndex
CREATE INDEX "brokerRequest_ownerId_status_idx" ON "brokerRequest"("ownerId", "status");

-- CreateIndex
CREATE INDEX "brokerRequest_brokerId_status_idx" ON "brokerRequest"("brokerId", "status");

-- CreateIndex
CREATE INDEX "brokerRequest_shipId_idx" ON "brokerRequest"("shipId");

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "deal" ADD CONSTRAINT "deal_brokerRequestId_fkey" FOREIGN KEY ("brokerRequestId") REFERENCES "brokerRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerRequest" ADD CONSTRAINT "brokerRequest_brokerId_fkey" FOREIGN KEY ("brokerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerRequest" ADD CONSTRAINT "brokerRequest_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brokerRequest" ADD CONSTRAINT "brokerRequest_shipId_fkey" FOREIGN KEY ("shipId") REFERENCES "ship"("id") ON DELETE CASCADE ON UPDATE CASCADE;
