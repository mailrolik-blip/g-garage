import fs from "node:fs";
import { PrismaClient } from "@prisma/client";
import { normalizeArticle, normalizeBrand, normalizeName, slugify } from "../src/lib/normalize.js";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
const dryRun = args.includes("--dry-run");

function parseCsv(text: string) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines.shift()?.split(",").map((h) => h.replace(/^"|"$/g, "")) ?? [];
  return lines.map((line) => {
    const values = line.match(/("(?:""|[^"])*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0).map((v) => v.replace(/^"|"$/g, "").replace(/""/g, '"')) ?? [];
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

async function main() {
  const file = get("--file");
  if (!file) throw new Error("--file is required");
  const rows = parseCsv(fs.readFileSync(file, "utf8"));
  const planned: unknown[] = [];
  for (const row of rows) {
    const decision = normalizeName(row.reviewDecision).toUpperCase();
    if (!decision || decision === "SKIP") continue;
    const item = await prisma.supplierCatalogItem.findUnique({ where: { id: row.itemId } });
    if (!item) throw new Error(`Unknown itemId ${row.itemId}`);
    if (decision === "MATCH") {
      if (!row.reviewedProductId) throw new Error(`MATCH requires reviewedProductId for ${row.itemId}`);
      planned.push({ decision, itemId: row.itemId, productId: row.reviewedProductId });
      if (!dryRun) {
        await prisma.supplierCatalogItem.update({ where: { id: item.id }, data: { matchedProductId: row.reviewedProductId, matchingStatus: "MANUAL_MATCHED", matchingMethod: "MANUAL", matchingConfidence: "100.00" } });
        if (item.sourceArticle) await prisma.supplierProductMapping.upsert({ where: { supplierId_normalizedSourceArticle_productId: { supplierId: item.supplierId, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, productId: row.reviewedProductId } }, update: { sourceName: item.sourceName, confidence: "100.00", note: row.note, isActive: true }, create: { supplierId: item.supplierId, sourceArticle: item.sourceArticle, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, sourceName: item.sourceName, productId: row.reviewedProductId, confidence: "100.00", createdBy: "catalog:import-review", note: row.note } });
      }
    } else if (decision === "REJECT") {
      planned.push({ decision, itemId: row.itemId, note: row.note });
      if (!dryRun) await prisma.supplierCatalogItem.update({ where: { id: item.id }, data: { matchingStatus: "REJECTED", matchingMethod: "MANUAL", isActive: false } });
    } else if (decision === "CREATE_PRODUCT") {
      const brandInput = normalizeName(row.brand);
      const article = normalizeName(row.article || item.sourceArticle);
      const name = normalizeName(row.name || item.sourceName);
      const categorySlug = normalizeName(row.category);
      if (!brandInput || !article || !name || !categorySlug) throw new Error(`CREATE_PRODUCT requires brand, article, name and category for ${row.itemId}`);
      planned.push({ decision, itemId: row.itemId, brand: brandInput, article, name, category: categorySlug });
      if (!dryRun) {
        const brandNorm = normalizeBrand(brandInput);
        const brand = await prisma.brand.upsert({ where: { normalizedName: brandNorm.normalizedName }, update: { name: brandNorm.name }, create: { name: brandNorm.name, normalizedName: brandNorm.normalizedName, slug: slugify(brandNorm.name) } });
        const category = await prisma.category.findFirstOrThrow({ where: { OR: [{ slug: categorySlug }, { name: { equals: categorySlug, mode: "insensitive" } }] } });
        const product = await prisma.product.upsert({ where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: normalizeArticle(article).normalizedArticle } }, update: { name, categoryId: category.id }, create: { sku: `${brandNorm.normalizedName}-${normalizeArticle(article).normalizedArticle}`.slice(0, 80), article, normalizedArticle: normalizeArticle(article).normalizedArticle, name, slug: slugify(`${brandNorm.name}-${article}-${name}`), brandId: brand.id, categoryId: category.id, unit: item.sourceUnit } });
        await prisma.supplierProductMapping.create({ data: { supplierId: item.supplierId, sourceArticle: item.sourceArticle ?? article, normalizedSourceArticle: normalizeArticle(item.sourceArticle ?? article).normalizedArticle, sourceName: item.sourceName, productId: product.id, confidence: "100.00", createdBy: "catalog:import-review", note: row.note } });
        await prisma.supplierCatalogItem.update({ where: { id: item.id }, data: { matchedProductId: product.id, matchingStatus: "MANUAL_MATCHED", matchingMethod: "MANUAL", matchingConfidence: "100.00" } });
      }
    } else {
      throw new Error(`Unsupported reviewDecision ${decision}`);
    }
  }
  console.log(JSON.stringify({ dryRun, plannedCount: planned.length, planned }, null, 2));
}

main().finally(async () => prisma.$disconnect());