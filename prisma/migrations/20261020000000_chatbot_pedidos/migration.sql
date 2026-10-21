-- CreateEnum
CREATE TYPE "OrderSource" AS ENUM ('PANEL', 'WEB', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'CONFIRMED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Order" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "customerPhone" TEXT,
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "items" JSONB,
ADD COLUMN     "pickupAt" TIMESTAMP(3),
ADD COLUMN     "source" "OrderSource" NOT NULL DEFAULT 'PANEL',
ADD COLUMN     "status" "OrderStatus" NOT NULL DEFAULT 'CONFIRMED',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateIndex
CREATE UNIQUE INDEX "Order_externalId_key" ON "Order"("externalId");

-- CreateIndex
CREATE INDEX "Order_status_date_idx" ON "Order"("status", "date");

