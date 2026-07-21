import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { normalizeArticle } from "../src/lib/normalize.js";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function has(name: string) { return args.includes(name); }

async function createOfferForItem(itemId: string, productId: string, method: "MANUAL" | "EXACT_SOURCE_MAPPING" = "MANUAL") {
  const item = await prisma.supplierCatalogItem.findUniqueOrThrow({ where: { id: itemId } });
  if (!item.sourceArticle || !item.retailPrice || !item.purchasePrice || !item.warehouseId) throw new Error("Item needs sourceArticle, warehouseId, retailPrice and purchasePrice before offer creation");
  await prisma.supplierOffer.upsert({
    where: { supplierId_warehouseId_supplierArticle: { supplierId: item.supplierId, warehouseId: item.warehouseId, supplierArticle: item.sourceArticle } },
    update: { productId, supplierCatalogItemId: item.id, retailPrice: item.retailPrice, purchasePrice: item.purchasePrice, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, matchedAt: new Date(), matchingMethod: method, isActive: true },
    create: { productId, supplierId: item.supplierId, warehouseId: item.warehouseId, supplierCatalogItemId: item.id, supplierArticle: item.sourceArticle, retailPrice: item.retailPrice, purchasePrice: item.purchasePrice, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, matchedAt: new Date(), matchingMethod: method },
  });
}

async function main() {
  if (has("--list")) {
    const status = get("--status");
    const items = await prisma.supplierCatalogItem.findMany({ where: status ? { matchingStatus: status as any } : {}, orderBy: { sourceRowNumber: "asc" }, take: 50, include: { matchedProduct: { include: { brand: true } } } });
    console.log(JSON.stringify(items.map((item) => ({ id: item.id, row: item.sourceRowNumber, article: item.sourceArticle, name: item.sourceName, brand: item.sourceBrand, price: item.retailPrice, status: item.matchingStatus, matchedProduct: item.matchedProduct ? `${item.matchedProduct.brand.name} ${item.matchedProduct.article}` : null })), null, 2));
    return;
  }
  const itemId = get("--item");
  if (itemId && !has("--candidates")) {
    console.log(JSON.stringify(await prisma.supplierCatalogItem.findUnique({ where: { id: itemId }, include: { reviewIssues: true, candidates: { include: { product: { include: { brand: true } } } } } }), null, 2));
    return;
  }
  const candidatesFor = get("--candidates") ?? (has("--candidates") ? itemId : undefined);
  if (candidatesFor) {
    const candidates = await prisma.productMatchCandidate.findMany({ where: { supplierCatalogItemId: candidatesFor }, include: { product: { include: { brand: true, category: true } } }, orderBy: { score: "desc" } });
    console.log(JSON.stringify(candidates, null, 2));
    return;
  }
  const matchItem = get("--match");
  const productId = get("--product");
  if (matchItem && productId) {
    const item = await prisma.supplierCatalogItem.update({ where: { id: matchItem }, data: { matchedProductId: productId, matchingStatus: "MANUAL_MATCHED", matchingMethod: "MANUAL", matchingConfidence: "100.00" } });
    if (item.sourceArticle) {
      await prisma.supplierProductMapping.upsert({
        where: { supplierId_normalizedSourceArticle_productId: { supplierId: item.supplierId, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, productId } },
        update: { sourceName: item.sourceName, confidence: "100.00", createdBy: "catalog:review", isActive: true },
        create: { supplierId: item.supplierId, sourceArticle: item.sourceArticle, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, sourceName: item.sourceName, productId, confidence: "100.00", createdBy: "catalog:review" },
      });
    }
    await createOfferForItem(matchItem, productId, "MANUAL");
    await prisma.productMatchCandidate.updateMany({ where: { supplierCatalogItemId: matchItem, productId }, data: { status: "ACCEPTED" } });
    console.log(JSON.stringify({ matched: matchItem, productId }, null, 2));
    return;
  }
  const rejectItem = get("--reject");
  if (rejectItem) {
    const reason = get("--reason") ?? "Rejected manually";
    const item = await prisma.supplierCatalogItem.update({ where: { id: rejectItem }, data: { matchingStatus: "REJECTED", matchingMethod: "MANUAL", isActive: false } });
    if (item.lastImportId) await prisma.importReviewIssue.create({ data: { importId: item.lastImportId, supplierCatalogItemId: item.id, code: "MANUAL_REJECT", severity: "INFO", message: reason } });
    await prisma.supplierOffer.updateMany({ where: { supplierCatalogItemId: item.id }, data: { isActive: false } });
    console.log(JSON.stringify({ rejected: rejectItem, reason }, null, 2));
    return;
  }
  const unmatchItem = get("--unmatch");
  if (unmatchItem) {
    const item = await prisma.supplierCatalogItem.update({ where: { id: unmatchItem }, data: { matchedProductId: null, matchingStatus: "UNMATCHED", matchingMethod: "NONE", matchingConfidence: null } });
    await prisma.supplierOffer.updateMany({ where: { supplierCatalogItemId: item.id }, data: { isActive: false } });
    await prisma.productMatchCandidate.updateMany({ where: { supplierCatalogItemId: item.id, status: "ACCEPTED" }, data: { status: "REJECTED" } });
    console.log(JSON.stringify({ unmatched: unmatchItem }, null, 2));
    return;
  }
  const exportPath = get("--export-csv");
  if (exportPath) {
    const items = await prisma.supplierCatalogItem.findMany({ where: { matchingStatus: { in: ["UNMATCHED", "NEEDS_REVIEW"] } }, include: { candidates: { include: { product: { include: { brand: true } } }, orderBy: { score: "desc" }, take: 1 } }, orderBy: { sourceRowNumber: "asc" } });
    const header = "itemId,sourceRowNumber,sourceArticle,sourceName,detectedBrand,price,stock,matchingStatus,candidateProductId,candidateBrand,candidateArticle,candidateName,confidence,reviewDecision,reviewedProductId,note";
    const escape = (value: unknown) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const lines = items.map((item) => {
      const c = item.candidates[0];
      return [item.id, item.sourceRowNumber, item.sourceArticle, item.sourceName, item.sourceBrand, item.retailPrice, item.stockQuantity, item.matchingStatus, c?.productId, c?.product.brand.name, c?.product.article, c?.product.name, c?.score, "", "", ""].map(escape).join(",");
    });
    fs.mkdirSync(path.dirname(exportPath), { recursive: true });
    fs.writeFileSync(exportPath, [header, ...lines].join("\n"));
    console.log(JSON.stringify({ exported: exportPath, rows: lines.length }, null, 2));
    return;
  }
  console.error("Usage: npm run catalog:review -- --list [--status STATUS] | --item ID | --candidates ID | --match ITEM --product PRODUCT | --reject ITEM --reason TEXT | --unmatch ITEM | --export-csv PATH");
  process.exit(2);
}

main().finally(async () => prisma.$disconnect());