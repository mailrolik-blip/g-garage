-- CreateEnum
CREATE TYPE "EnrichmentJobStatus" AS ENUM ('NEW', 'RESEARCHING', 'STOPPED', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "EnrichmentCandidateStatus" AS ENUM ('NEW', 'RESEARCHING', 'CONFIRMED', 'NEEDS_REVIEW', 'REJECTED', 'UNRESOLVED');

-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('MANUFACTURER', 'OFFICIAL_DISTRIBUTOR', 'PARTS_CATALOG', 'LARGE_RETAILER', 'MARKETPLACE', 'OTHER');

-- CreateEnum
CREATE TYPE "EvidenceType" AS ENUM ('EXACT_ARTICLE', 'BRAND_ARTICLE', 'PRODUCT_NAME', 'OEM_REFERENCE', 'GTIN', 'CATEGORY', 'CROSS_REFERENCE');

-- CreateEnum
CREATE TYPE "EnrichmentDecisionValue" AS ENUM ('ACCEPT', 'REVIEW', 'REJECT', 'UNRESOLVED');

-- CreateTable
CREATE TABLE "EnrichmentJob" (
    "id" TEXT NOT NULL,
    "supplierId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" "EnrichmentJobStatus" NOT NULL DEFAULT 'NEW',
    "totalItems" INTEGER NOT NULL DEFAULT 0,
    "researchedItems" INTEGER NOT NULL DEFAULT 0,
    "confirmedItems" INTEGER NOT NULL DEFAULT 0,
    "reviewItems" INTEGER NOT NULL DEFAULT 0,
    "unresolvedItems" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentCandidate" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "supplierCatalogItemId" TEXT NOT NULL,
    "proposedBrand" TEXT,
    "proposedArticle" TEXT,
    "proposedName" TEXT,
    "proposedCategory" TEXT,
    "proposedOemNumbers" JSONB,
    "proposedGtin" TEXT,
    "proposedUnit" TEXT,
    "confidence" DECIMAL(5,2),
    "status" "EnrichmentCandidateStatus" NOT NULL DEFAULT 'NEW',
    "conflictReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EnrichmentCandidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentEvidence" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "sourceType" "SourceType" NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "sourceDomain" TEXT NOT NULL,
    "sourceTitle" TEXT,
    "accessedAt" TIMESTAMP(3) NOT NULL,
    "evidenceType" "EvidenceType" NOT NULL,
    "extractedBrand" TEXT,
    "extractedArticle" TEXT,
    "extractedName" TEXT,
    "extractedCategory" TEXT,
    "extractedOemNumbers" JSONB,
    "extractedGtin" TEXT,
    "notes" TEXT,
    "reliabilityScore" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EnrichmentDecision" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "decision" "EnrichmentDecisionValue" NOT NULL,
    "decidedBy" TEXT,
    "note" TEXT,
    "productId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EnrichmentDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "EnrichmentJob_supplierId_status_idx" ON "EnrichmentJob"("supplierId", "status");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_jobId_status_idx" ON "EnrichmentCandidate"("jobId", "status");

-- CreateIndex
CREATE INDEX "EnrichmentCandidate_supplierCatalogItemId_idx" ON "EnrichmentCandidate"("supplierCatalogItemId");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentCandidate_jobId_supplierCatalogItemId_key" ON "EnrichmentCandidate"("jobId", "supplierCatalogItemId");

-- CreateIndex
CREATE INDEX "EnrichmentEvidence_candidateId_idx" ON "EnrichmentEvidence"("candidateId");

-- CreateIndex
CREATE INDEX "EnrichmentEvidence_sourceDomain_idx" ON "EnrichmentEvidence"("sourceDomain");

-- CreateIndex
CREATE UNIQUE INDEX "EnrichmentEvidence_candidateId_sourceUrl_evidenceType_key" ON "EnrichmentEvidence"("candidateId", "sourceUrl", "evidenceType");

-- CreateIndex
CREATE INDEX "EnrichmentDecision_candidateId_idx" ON "EnrichmentDecision"("candidateId");

-- CreateIndex
CREATE INDEX "EnrichmentDecision_productId_idx" ON "EnrichmentDecision"("productId");

-- AddForeignKey
ALTER TABLE "EnrichmentJob" ADD CONSTRAINT "EnrichmentJob_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentCandidate" ADD CONSTRAINT "EnrichmentCandidate_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "EnrichmentJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentCandidate" ADD CONSTRAINT "EnrichmentCandidate_supplierCatalogItemId_fkey" FOREIGN KEY ("supplierCatalogItemId") REFERENCES "SupplierCatalogItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentEvidence" ADD CONSTRAINT "EnrichmentEvidence_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "EnrichmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentDecision" ADD CONSTRAINT "EnrichmentDecision_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "EnrichmentCandidate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EnrichmentDecision" ADD CONSTRAINT "EnrichmentDecision_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

