-- CreateTable
CREATE TABLE "ColdPiecePrice" (
    "id" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "pieceTypeId" TEXT NOT NULL,
    "price" DECIMAL(8,2) NOT NULL,
    "effectiveFrom" DATE NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ColdPiecePrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ColdStock" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "branchId" TEXT NOT NULL,
    "pieceTypeId" TEXT NOT NULL,
    "originBranchId" TEXT,
    "originDate" DATE,
    "quantityReceived" DECIMAL(10,2) NOT NULL,
    "unitPrice" DECIMAL(8,2) NOT NULL,
    "quantitySold" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ColdStock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ColdPiecePrice_branchId_pieceTypeId_isActive_idx" ON "ColdPiecePrice"("branchId", "pieceTypeId", "isActive");

-- CreateIndex
CREATE INDEX "ColdStock_date_branchId_idx" ON "ColdStock"("date", "branchId");

-- CreateIndex
CREATE UNIQUE INDEX "ColdStock_date_branchId_pieceTypeId_key" ON "ColdStock"("date", "branchId", "pieceTypeId");

-- AddForeignKey
ALTER TABLE "ColdPiecePrice" ADD CONSTRAINT "ColdPiecePrice_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColdPiecePrice" ADD CONSTRAINT "ColdPiecePrice_pieceTypeId_fkey" FOREIGN KEY ("pieceTypeId") REFERENCES "PieceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColdStock" ADD CONSTRAINT "ColdStock_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColdStock" ADD CONSTRAINT "ColdStock_pieceTypeId_fkey" FOREIGN KEY ("pieceTypeId") REFERENCES "PieceType"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
