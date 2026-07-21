-- CreateEnum
CREATE TYPE "MatchingStatus" AS ENUM ('UNMATCHED', 'AUTO_MATCHED', 'MANUAL_MATCHED', 'NEEDS_REVIEW', 'REJECTED');

-- CreateEnum
CREATE TYPE "MatchingMethod" AS ENUM ('EXACT_BRAND_ARTICLE', 'EXACT_SOURCE_MAPPING', 'ARTICLE_NAME', 'MANUAL', 'NONE');

-- CreateEnum
CREATE TYPE "CandidateStatus" AS ENUM ('SUGGESTED', 'ACCEPTED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "Severity" AS ENUM ('INFO', 'WARNING', 'ERROR');

-- AlterTable
ALTER TABLE "SupplierOffer" ADD COLUMN     "matchedAt" TIMESTAMP(3),
ADD COLUMN     "matchingMethod" "MatchingMethod",
ADD COLUMN     "supplierCatalogItemId" TEXT;

-- CreateTable
CREATE TABLE "SupplierCatalogItem" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "warehouseId" TEXT,
    "sourceKey" TEXT NOT NULL,
    "sourceArticle" TEXT,
    "normalizedSourceArticle" TEXT,
    "sourceName" TEXT,
    "normalizedSourceName" TEXT,
    "sourceBrand" TEXT,
    "sourceCategory" TEXT,
    "sourceUnit" TEXT,
    "sourceStockRaw" TEXT,
    "sourcePriceRaw" TEXT,
    "purchasePrice" DECIMAL(14,2),
    "retailPrice" DECIMAL(14,2),
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "stockQuantity" INTEGER,
    "deliveryDaysMin" INTEGER,
    "deliveryDaysMax" INTEGER,
    "minimumOrderQuantity" INTEGER NOT NULL DEFAULT 1,
    "rawData" JSONB NOT NULL,
    "sourceRowNumber" INTEGER NOT NULL,
    "sourceUpdatedAt" TIMESTAMP(3),
    "lastImportId" TEXT,
    "matchingStatus" "MatchingStatus" NOT NULL DEFAULT 'UNMATCHED',
    "matchedProductId" TEXT,
    "matchingConfidence" DECIMAL(5,2),
    "matchingMethod" "MatchingMethod" NOT NULL DEFAULT 'NONE',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierCatalogItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SupplierProductMapping" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "sourceArticle" TEXT NOT NULL,
    "normalizedSourceArticle" TEXT NOT NULL,
    "sourceName" TEXT,
    "productId" TEXT NOT NULL,
    "confidence" DECIMAL(5,2) NOT NULL,
    "createdBy" TEXT,
    "note" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProductMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductMatchCandidate" (
    "id" TEXT NOT NULL,
    "supplierCatalogItemId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "reasons" JSONB NOT NULL,
    "status" "CandidateStatus" NOT NULL DEFAULT 'SUGGESTED',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductMatchCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportReviewIssue" (
    "id" TEXT NOT NULL,
    "importId" TEXT NOT NULL,
    "supplierCatalogItemId" TEXT,
    "code" TEXT NOT NULL,
    "severity" "Severity" NOT NULL,
    "message" TEXT NOT NULL,
    "details" JSONB,
    "resolvedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportReviewIssue_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_supplierId_matchingStatus_idx" ON "SupplierCatalogItem"("supplierId", "matchingStatus");

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_warehouseId_idx" ON "SupplierCatalogItem"("warehouseId");

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_normalizedSourceArticle_idx" ON "SupplierCatalogItem"("normalizedSourceArticle");

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_matchedProductId_idx" ON "SupplierCatalogItem"("matchedProductId");

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_lastImportId_idx" ON "SupplierCatalogItem"("lastImportId");

-- CreateIndex
CREATE INDEX "SupplierCatalogItem_isActive_idx" ON "SupplierCatalogItem"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierCatalogItem_supplierId_warehouseId_sourceKey_key" ON "SupplierCatalogItem"("supplierId", "warehouseId", "sourceKey");

-- CreateIndex
CREATE INDEX "SupplierProductMapping_supplierId_normalizedSourceArticle_i_idx" ON "SupplierProductMapping"("supplierId", "normalizedSourceArticle", "isActive");

-- CreateIndex
CREATE INDEX "SupplierProductMapping_productId_idx" ON "SupplierProductMapping"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProductMapping_supplierId_normalizedSourceArticle_p_key" ON "SupplierProductMapping"("supplierId", "normalizedSourceArticle", "productId");

-- CreateIndex
CREATE INDEX "ProductMatchCandidate_supplierCatalogItemId_status_idx" ON "ProductMatchCandidate"("supplierCatalogItemId", "status");

-- CreateIndex
CREATE INDEX "ProductMatchCandidate_productId_idx" ON "ProductMatchCandidate"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductMatchCandidate_supplierCatalogItemId_productId_key" ON "ProductMatchCandidate"("supplierCatalogItemId", "productId");

-- CreateIndex
CREATE INDEX "ImportReviewIssue_importId_idx" ON "ImportReviewIssue"("importId");

-- CreateIndex
CREATE INDEX "ImportReviewIssue_supplierCatalogItemId_idx" ON "ImportReviewIssue"("supplierCatalogItemId");

-- CreateIndex
CREATE INDEX "ImportReviewIssue_code_severity_idx" ON "ImportReviewIssue"("code", "severity");

-- CreateIndex
CREATE INDEX "SupplierOffer_supplierCatalogItemId_idx" ON "SupplierOffer"("supplierCatalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierOffer_productId_supplierId_warehouseId_supplierCata_key" ON "SupplierOffer"("productId", "supplierId", "warehouseId", "supplierCatalogItemId");

-- AddForeignKey
ALTER TABLE "SupplierOffer" ADD CONSTRAINT "SupplierOffer_supplierCatalogItemId_fkey" FOREIGN KEY ("supplierCatalogItemId") REFERENCES "SupplierCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCatalogItem" ADD CONSTRAINT "SupplierCatalogItem_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCatalogItem" ADD CONSTRAINT "SupplierCatalogItem_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCatalogItem" ADD CONSTRAINT "SupplierCatalogItem_lastImportId_fkey" FOREIGN KEY ("lastImportId") REFERENCES "PriceImport"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierCatalogItem" ADD CONSTRAINT "SupplierCatalogItem_matchedProductId_fkey" FOREIGN KEY ("matchedProductId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProductMapping" ADD CONSTRAINT "SupplierProductMapping_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SupplierProductMapping" ADD CONSTRAINT "SupplierProductMapping_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMatchCandidate" ADD CONSTRAINT "ProductMatchCandidate_supplierCatalogItemId_fkey" FOREIGN KEY ("supplierCatalogItemId") REFERENCES "SupplierCatalogItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductMatchCandidate" ADD CONSTRAINT "ProductMatchCandidate_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportReviewIssue" ADD CONSTRAINT "ImportReviewIssue_importId_fkey" FOREIGN KEY ("importId") REFERENCES "PriceImport"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportReviewIssue" ADD CONSTRAINT "ImportReviewIssue_supplierCatalogItemId_fkey" FOREIGN KEY ("supplierCatalogItemId") REFERENCES "SupplierCatalogItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;

