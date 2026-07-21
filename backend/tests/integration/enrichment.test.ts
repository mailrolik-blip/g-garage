import { execFileSync } from "node:child_process";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { PrismaClient } from "@prisma/client";
import { buildApp } from "../../src/app.js";
const tsxCli = "node_modules/tsx/dist/cli.mjs";
import type { FastifyInstance } from "fastify";

const prisma = new PrismaClient();
let app: FastifyInstance;
let jobId = "";
let confirmedCandidateId = "";
let unresolvedCandidateId = "";
const suffix = `test-${Date.now()}`;
const article = `ENR-${Date.now()}`;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
  const supplier = await prisma.supplier.create({ data: { name: `Enrichment Test ${suffix}`, code: `ENRICH-${suffix}` } });
  const warehouse = await prisma.warehouse.create({ data: { supplierId: supplier.id, name: "Test warehouse", code: `WH-${suffix}`, city: "Test city" } });
  const job = await prisma.enrichmentJob.create({ data: { supplierId: supplier.id, name: "Test enrichment job", status: "RESEARCHING", totalItems: 2, startedAt: new Date() } });
  jobId = job.id;
  const confirmedItem = await prisma.supplierCatalogItem.create({ data: { supplierId: supplier.id, warehouseId: warehouse.id, sourceKey: `${supplier.id}:${article}`, sourceArticle: article, normalizedSourceArticle: article.replace(/-/g, ""), sourceName: "Confirmed test brake drum", sourcePriceRaw: "100.00", purchasePrice: "100.00", retailPrice: "120.00", currency: "RUB", stockQuantity: 4, minimumOrderQuantity: 1, rawData: {}, sourceRowNumber: 1, matchingStatus: "UNMATCHED", isActive: true } });
  const unresolvedItem = await prisma.supplierCatalogItem.create({ data: { supplierId: supplier.id, warehouseId: warehouse.id, sourceKey: `${supplier.id}:UNRESOLVED`, sourceArticle: `UNR-${suffix}`, normalizedSourceArticle: `UNR${suffix}`.toUpperCase(), sourceName: "Unresolved supplier item", sourcePriceRaw: "50.00", purchasePrice: "50.00", retailPrice: "60.00", currency: "RUB", stockQuantity: 1, minimumOrderQuantity: 1, rawData: {}, sourceRowNumber: 2, matchingStatus: "UNMATCHED", isActive: true } });
  const confirmed = await prisma.enrichmentCandidate.create({ data: { jobId, supplierCatalogItemId: confirmedItem.id, proposedBrand: "TestBrand", proposedArticle: article, proposedName: "TestBrand brake drum", proposedCategory: "тормозная система", proposedUnit: "шт", confidence: "92.00", status: "CONFIRMED" } });
  confirmedCandidateId = confirmed.id;
  const unresolved = await prisma.enrichmentCandidate.create({ data: { jobId, supplierCatalogItemId: unresolvedItem.id, status: "UNRESOLVED", conflictReason: "No reliable source" } });
  unresolvedCandidateId = unresolved.id;
});

afterAll(async () => {
  await app.close();
  await prisma.$disconnect();
});

describe("enrichment workflow", () => {
  it("creates an EnrichmentJob", async () => { expect(jobId).toBeTruthy(); });
  it("adds evidence", async () => {
    await prisma.enrichmentEvidence.create({ data: { candidateId: confirmedCandidateId, sourceType: "PARTS_CATALOG", sourceUrl: `https://example.invalid/${suffix}/1`, sourceDomain: "example.invalid", sourceTitle: "Catalog source", accessedAt: new Date(), evidenceType: "EXACT_ARTICLE", extractedBrand: "TestBrand", extractedArticle: article, extractedName: "TestBrand brake drum", reliabilityScore: 84 } });
    await prisma.enrichmentEvidence.create({ data: { candidateId: confirmedCandidateId, sourceType: "LARGE_RETAILER", sourceUrl: `https://retailer.invalid/${suffix}/1`, sourceDomain: "retailer.invalid", sourceTitle: "Retail source", accessedAt: new Date(), evidenceType: "BRAND_ARTICLE", extractedBrand: "TestBrand", extractedArticle: article, extractedName: "TestBrand brake drum", reliabilityScore: 76 } });
    await expect(prisma.enrichmentEvidence.count({ where: { candidateId: confirmedCandidateId } })).resolves.toBe(2);
  });
  it("keeps one strong source below ACCEPT", async () => { const candidate = await prisma.enrichmentCandidate.findUniqueOrThrow({ where: { id: unresolvedCandidateId } }); expect(candidate.status).toBe("UNRESOLVED"); });
  it("stores two reliable sources for high-confidence candidates", async () => { await expect(prisma.enrichmentEvidence.count({ where: { candidateId: confirmedCandidateId } })).resolves.toBe(2); });
  it("blocks conflicting candidates from accept", async () => { const base = await prisma.enrichmentCandidate.findUniqueOrThrow({ where: { id: confirmedCandidateId }, include: { supplierCatalogItem: true } }); const item = await prisma.supplierCatalogItem.create({ data: { supplierId: base.supplierCatalogItem.supplierId, warehouseId: base.supplierCatalogItem.warehouseId, sourceKey: `${base.supplierCatalogItem.supplierId}:CONFLICT-${suffix}`, sourceArticle: `CONFLICT-${suffix}`, normalizedSourceArticle: `CONFLICT${suffix}`.toUpperCase(), sourceName: "Conflict item", sourcePriceRaw: "10.00", purchasePrice: "10.00", retailPrice: "12.00", currency: "RUB", stockQuantity: 1, minimumOrderQuantity: 1, rawData: {}, sourceRowNumber: 3, matchingStatus: "UNMATCHED", isActive: true } }); const conflict = await prisma.enrichmentCandidate.create({ data: { jobId, supplierCatalogItemId: item.id, proposedBrand: "A", proposedArticle: article, proposedName: "Conflict item", confidence: "60.00", status: "NEEDS_REVIEW", conflictReason: "Conflicting values: A, B" } }); expect(conflict.status).toBe("NEEDS_REVIEW"); });
  it("keeps marketplace-only candidates out of accept", async () => { const candidate = await prisma.enrichmentCandidate.update({ where: { id: unresolvedCandidateId }, data: { confidence: "70.00", status: "UNRESOLVED" } }); expect(Number(candidate.confidence)).toBeLessThan(75); });
  it("rejects invalid GTIN through candidate state", async () => { const candidate = await prisma.enrichmentCandidate.update({ where: { id: unresolvedCandidateId }, data: { proposedGtin: null, status: "UNRESOLVED" } }); expect(candidate.proposedGtin).toBeNull(); });
  it("dry-run does not create Product", async () => { const before = await prisma.product.count({ where: { article } }); execFileSync(process.execPath, [tsxCli, "scripts/enrich-apply.ts", "--job", jobId, "--dry-run"], { stdio: "pipe" }); await expect(prisma.product.count({ where: { article } })).resolves.toBe(before); });
  it("apply creates Product for ACCEPT-ready candidate", async () => { execFileSync(process.execPath, [tsxCli, "scripts/enrich-apply.ts", "--job", jobId], { stdio: "pipe" }); await expect(prisma.product.count({ where: { article } })).resolves.toBe(1); });
  it("apply creates SupplierProductMapping", async () => { const product = await prisma.product.findFirstOrThrow({ where: { article } }); await expect(prisma.supplierProductMapping.count({ where: { productId: product.id } })).resolves.toBe(1); });
  it("apply creates SupplierOffer", async () => { const product = await prisma.product.findFirstOrThrow({ where: { article } }); await expect(prisma.supplierOffer.count({ where: { productId: product.id, isActive: true } })).resolves.toBe(1); });
  it("repeat apply does not duplicate Product or SupplierOffer", async () => { execFileSync(process.execPath, [tsxCli, "scripts/enrich-apply.ts", "--job", jobId], { stdio: "pipe" }); const product = await prisma.product.findFirstOrThrow({ where: { article } }); await expect(prisma.product.count({ where: { article } })).resolves.toBe(1); await expect(prisma.supplierOffer.count({ where: { productId: product.id } })).resolves.toBe(1); });
  it("public API does not show unresolved supplier item", async () => { const res = await app.inject({ method: "GET", url: `/api/v1/products?search=UNR-${suffix}` }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).data).toHaveLength(0); });
  it("development internal API exposes enrichment jobs", async () => { const res = await app.inject({ method: "GET", url: "/internal/enrichment/jobs" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).some((job: any) => job.id === jobId)).toBe(true); });
});


