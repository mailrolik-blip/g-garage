import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { normalizeArticle, normalizeBrand, slugify } from "../../src/lib/normalize.js";

const prisma = new PrismaClient();
const fixture = path.resolve("imports/fixtures/orion-fixture.csv");
const mapping = path.resolve("imports/fixtures/orion-fixture.mapping.json");
const tsx = path.resolve("node_modules/tsx/dist/cli.mjs");

function runScript(script: string, args: string[]) {
  return execFileSync(process.execPath, [tsx, script, ...args], { cwd: process.cwd(), encoding: "utf8" });
}
function runImport(args: string[]) { return runScript("scripts/import-orion-price.ts", ["--file", fixture, "--mapping", mapping, ...args]); }

async function ensureProduct(brandName: string, article: string, name: string) {
  const brandNorm = normalizeBrand(brandName);
  const brand = await prisma.brand.upsert({ where: { normalizedName: brandNorm.normalizedName }, update: { name: brandNorm.name }, create: { name: brandNorm.name, normalizedName: brandNorm.normalizedName, slug: slugify(brandNorm.name) } });
  const category = await prisma.category.findFirstOrThrow();
  return prisma.product.upsert({
    where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: normalizeArticle(article).normalizedArticle } },
    update: { name, categoryId: category.id, isActive: true },
    create: { sku: `TEST-${brandNorm.normalizedName}-${normalizeArticle(article).normalizedArticle}`, article, normalizedArticle: normalizeArticle(article).normalizedArticle, name, slug: slugify(`${brandNorm.name}-${article}-${name}`), brandId: brand.id, categoryId: category.id, unit: "pcs" },
  });
}

beforeAll(async () => {
  await prisma.productMatchCandidate.deleteMany({ where: { supplierCatalogItem: { supplier: { code: "FIXTURE" } } } });
  await prisma.importReviewIssue.deleteMany({ where: { supplierCatalogItem: { supplier: { code: "FIXTURE" } } } });
  await prisma.priceImportRow.deleteMany({ where: { import: { supplier: { code: "FIXTURE" } } } });
  await prisma.priceImport.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.supplierOffer.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.supplierCatalogItem.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.warehouse.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.supplierProductMapping.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.supplier.deleteMany({ where: { code: "FIXTURE" } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "TEST-" } } });
  await ensureProduct("Brembo", "BR-100", "Brake disc front");
  await ensureProduct("BOSCH", "BX-1", "Oxygen sensor");
  await ensureProduct("TRW", "TR-300", "Tie rod");
});

afterAll(async () => { await prisma.$disconnect(); });

describe("Orion staging importer", () => {
  it("dry-run reports staging metrics and does not change database", async () => {
    const before = await prisma.supplierCatalogItem.count({ where: { supplier: { code: "FIXTURE" } } });
    const output = runImport(["--dry-run"]);
    const after = await prisma.supplierCatalogItem.count({ where: { supplier: { code: "FIXTURE" } } });
    expect(output).toContain('"stagingValid": 6');
    expect(output).toContain('"stagingRejected": 1');
    expect(after).toBe(before);
  });

  it("imports no-brand row as SupplierCatalogItem without Product", async () => {
    runImport([]);
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "NB-100" } });
    expect(item.matchingStatus).toBe("UNMATCHED");
    expect(item.sourceBrand).toBeNull();
    expect(await prisma.product.findFirst({ where: { normalizedArticle: "NB100" } })).toBeNull();
  });

  it("exact brand plus article creates auto-match and SupplierOffer", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "BR-100" } });
    expect(item.matchingStatus).toBe("AUTO_MATCHED");
    expect(await prisma.supplierOffer.count({ where: { supplier: { code: "FIXTURE" }, supplierArticle: "BR-100", isActive: true } })).toBe(1);
  });

  it("brand alias from name can create auto-match", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "BX-1" } });
    expect(item.sourceBrand).toBe("BOSCH");
    expect(item.matchingStatus).toBe("AUTO_MATCHED");
  });

  it("ambiguous brand creates NEEDS_REVIEW", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "AMB-1" } });
    expect(item.matchingStatus).toBe("NEEDS_REVIEW");
  });

  it("repeat import returns ALREADY_IMPORTED", () => { expect(runImport([])).toContain("ALREADY_IMPORTED"); });

  it("force import updates staging item and does not duplicate it", async () => {
    const output = runImport(["--force"]);
    expect(output).toContain('"stagingUpdated"');
    expect(await prisma.supplierCatalogItem.count({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "BR-100" } })).toBe(1);
  });

  it("price changes update staging and offer", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "BR-100" } });
    expect(Number(item.retailPrice)).toBe(1300.75);
    const offer = await prisma.supplierOffer.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, supplierArticle: "BR-100" } });
    expect(Number(offer.retailPrice)).toBe(1300.75);
  });

  it("rawData is preserved and rejected row stores issue", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, matchingStatus: "REJECTED" } });
    expect(item.rawData).toBeTruthy();
    expect(await prisma.importReviewIssue.count({ where: { supplierCatalogItemId: item.id, code: "MINIMAL_DATA_MISSING" } })).toBeGreaterThan(0);
  });

  it("manual match creates mapping", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "NB-100" } });
    const product = await ensureProduct("MANN", "NB-100", "Generic oil filter");
    runScript("scripts/catalog-review.ts", ["--match", item.id, "--product", product.id]);
    expect(await prisma.supplierProductMapping.count({ where: { supplier: { code: "FIXTURE" }, productId: product.id } })).toBe(1);
  });

  it("unmatch deactivates linked offer", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "NB-100" } });
    runScript("scripts/catalog-review.ts", ["--unmatch", item.id]);
    expect(await prisma.supplierOffer.count({ where: { supplierCatalogItemId: item.id, isActive: true } })).toBe(0);
  });

  it("CSV dry-run does not change database", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "NB-100" } });
    const product = await ensureProduct("MANN", "NB-100", "Generic oil filter");
    const file = path.resolve("tmp/review-test.csv");
    fs.writeFileSync(file, `itemId,reviewDecision,reviewedProductId,note\n${item.id},MATCH,${product.id},dry run\n`);
    const before = await prisma.supplierProductMapping.count({ where: { supplier: { code: "FIXTURE" }, productId: product.id } });
    runScript("scripts/catalog-import-review.ts", ["--file", file, "--dry-run"]);
    const after = await prisma.supplierProductMapping.count({ where: { supplier: { code: "FIXTURE" }, productId: product.id } });
    expect(after).toBe(before);
  });

  it("CSV MATCH applies decision", async () => {
    const item = await prisma.supplierCatalogItem.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, sourceArticle: "NB-100" } });
    const product = await ensureProduct("MANN", "NB-100", "Generic oil filter");
    const file = path.resolve("tmp/review-apply.csv");
    fs.writeFileSync(file, `itemId,reviewDecision,reviewedProductId,note\n${item.id},MATCH,${product.id},apply\n`);
    runScript("scripts/catalog-import-review.ts", ["--file", file]);
    const updated = await prisma.supplierCatalogItem.findUniqueOrThrow({ where: { id: item.id } });
    expect(updated.matchingStatus).toBe("MANUAL_MATCHED");
  });
});