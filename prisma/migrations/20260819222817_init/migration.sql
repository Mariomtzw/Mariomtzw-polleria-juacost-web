-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'STAFF');

-- CreateEnum
CREATE TYPE "WeatherCondition" AS ENUM ('CLEAR', 'CLOUDS', 'RAIN', 'STORM', 'FOG', 'OTHER');

-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('NATIONAL_HOLIDAY', 'MUNICIPAL_FIESTA', 'PATRONAL_FIESTA', 'LOCAL_EVENT', 'PAYDAY');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "passwordHash" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'OWNER',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "meta" JSONB,
    "ip" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("key")
);

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "code" TEXT NOT NULL,
    "address" TEXT,
    "town" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Seller" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "branchId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Seller_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PieceType" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "perChicken" INTEGER NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "PieceType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceList" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "precioPolloEntero" DECIMAL(8,2),
    "precioPechuga" DECIMAL(8,2) NOT NULL,
    "precioPierna" DECIMAL(8,2) NOT NULL,
    "precioAla" DECIMAL(8,2) NOT NULL,
    "precioHuacal" DECIMAL(8,2) NOT NULL,
    "precioRabadilla" DECIMAL(8,2) NOT NULL,
    "precioHigado" DECIMAL(8,2) NOT NULL,
    "precioPata" DECIMAL(8,2) NOT NULL,
    "precioCabeza" DECIMAL(8,2) NOT NULL,
    "precioPorPieza" DECIMAL(10,2) NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PriceList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailySale" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "pollosAsignados" DECIMAL(8,2) NOT NULL,
    "valorEstimado" DECIMAL(12,2) NOT NULL,
    "vendidoReal" DECIMAL(12,2) NOT NULL,
    "precioPechuga" DECIMAL(8,2) NOT NULL,
    "precioPierna" DECIMAL(8,2) NOT NULL,
    "precioAla" DECIMAL(8,2) NOT NULL,
    "precioHuacal" DECIMAL(8,2) NOT NULL,
    "precioRabadilla" DECIMAL(8,2) NOT NULL,
    "precioHigado" DECIMAL(8,2) NOT NULL,
    "precioPata" DECIMAL(8,2) NOT NULL,
    "precioCabeza" DECIMAL(8,2) NOT NULL,
    "precioPorPieza" DECIMAL(10,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailySale_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "quantity" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Leftover" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" TEXT NOT NULL,
    "pieceTypeId" TEXT NOT NULL,
    "quantity" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(8,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Leftover_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PayrollEntry" (
    "id" TEXT NOT NULL,
    "sellerId" TEXT NOT NULL,
    "periodStart" DATE NOT NULL,
    "periodEnd" DATE NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PayrollEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WeatherDaily" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "tempMaxC" DOUBLE PRECISION,
    "tempMinC" DOUBLE PRECISION,
    "tempAvgC" DOUBLE PRECISION,
    "precipitationMm" DOUBLE PRECISION,
    "humidityPct" DOUBLE PRECISION,
    "condition" "WeatherCondition",
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "WeatherDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EventType" NOT NULL,
    "town" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "startDate" DATE NOT NULL,
    "endDate" DATE,
    "description" TEXT,
    "source" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalendarEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventBranchImpact" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "distanceKm" DOUBLE PRECISION,
    "weight" DOUBLE PRECISION,

    CONSTRAINT "EventBranchImpact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesForecast" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "predictedRev" DECIMAL(12,2),
    "actualRev" DECIMAL(12,2),
    "factors" JSONB,
    "modelVersion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesForecast_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "contentType" TEXT,
    "sizeBytes" INTEGER,
    "uploadedById" TEXT NOT NULL,
    "saleId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "AuditLog_userId_createdAt_idx" ON "AuditLog"("userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_code_key" ON "Branch"("code");

-- CreateIndex
CREATE INDEX "Branch_isActive_idx" ON "Branch"("isActive");

-- CreateIndex
CREATE INDEX "Seller_branchId_isActive_idx" ON "Seller"("branchId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "PieceType_code_key" ON "PieceType"("code");

-- CreateIndex
CREATE INDEX "PriceList_branchId_effectiveFrom_idx" ON "PriceList"("branchId", "effectiveFrom");

-- CreateIndex
CREATE INDEX "PriceList_branchId_isActive_idx" ON "PriceList"("branchId", "isActive");

-- CreateIndex
CREATE INDEX "DailySale_date_idx" ON "DailySale"("date");

-- CreateIndex
CREATE INDEX "DailySale_branchId_date_idx" ON "DailySale"("branchId", "date");

-- CreateIndex
CREATE INDEX "DailySale_sellerId_date_idx" ON "DailySale"("sellerId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "DailySale_date_branchId_key" ON "DailySale"("date", "branchId");

-- CreateIndex
CREATE INDEX "Order_branchId_date_idx" ON "Order"("branchId", "date");

-- CreateIndex
CREATE INDEX "Leftover_branchId_date_idx" ON "Leftover"("branchId", "date");

-- CreateIndex
CREATE INDEX "PayrollEntry_sellerId_periodStart_idx" ON "PayrollEntry"("sellerId", "periodStart");

-- CreateIndex
CREATE INDEX "WeatherDaily_date_idx" ON "WeatherDaily"("date");

-- CreateIndex
CREATE UNIQUE INDEX "WeatherDaily_branchId_date_key" ON "WeatherDaily"("branchId", "date");

-- CreateIndex
CREATE INDEX "CalendarEvent_startDate_idx" ON "CalendarEvent"("startDate");

-- CreateIndex
CREATE INDEX "CalendarEvent_type_idx" ON "CalendarEvent"("type");

-- CreateIndex
CREATE INDEX "EventBranchImpact_branchId_idx" ON "EventBranchImpact"("branchId");

-- CreateIndex
CREATE UNIQUE INDEX "EventBranchImpact_eventId_branchId_key" ON "EventBranchImpact"("eventId", "branchId");

-- CreateIndex
CREATE INDEX "SalesForecast_branchId_date_idx" ON "SalesForecast"("branchId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "SalesForecast_branchId_date_modelVersion_key" ON "SalesForecast"("branchId", "date", "modelVersion");

-- CreateIndex
CREATE INDEX "Attachment_saleId_idx" ON "Attachment"("saleId");

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Seller" ADD CONSTRAINT "Seller_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceList" ADD CONSTRAINT "PriceList_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailySale" ADD CONSTRAINT "DailySale_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "Order_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leftover" ADD CONSTRAINT "Leftover_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Leftover" ADD CONSTRAINT "Leftover_pieceTypeId_fkey" FOREIGN KEY ("pieceTypeId") REFERENCES "PieceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PayrollEntry" ADD CONSTRAINT "PayrollEntry_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "Seller"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WeatherDaily" ADD CONSTRAINT "WeatherDaily_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBranchImpact" ADD CONSTRAINT "EventBranchImpact_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "CalendarEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EventBranchImpact" ADD CONSTRAINT "EventBranchImpact_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesForecast" ADD CONSTRAINT "SalesForecast_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "DailySale"("id") ON DELETE SET NULL ON UPDATE CASCADE;
