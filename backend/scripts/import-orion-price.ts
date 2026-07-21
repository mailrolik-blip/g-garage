import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { PrismaClient } from "@prisma/client";
import { chooseBestName, normalizeArticle, normalizeBrand, normalizeName, parsePrice, parseStock, productIdentity, sha256File, slugify } from "../src/lib/normalize.js";

type Mapping = {
  supplier: { name: string; code: string };
  warehouse: { name: string; code: string; city: string | null };
  sheetName: string | null;
  headerRow: number | null;
  columns: Record<string, string | null>;
  defaults: { currency: string; unit: string; minimumOrderQuantity: number };
  deliveryRules: { defaultDaysMin: number | null; defaultDaysMax: number | null };
  skipRows: number[];
};

type Args = { file: string; dryRun: boolean; force: boolean; deactivateMissing: boolean; mapping: string };
type NormalizedRow = { brand: string; article: string; normalizedArticle: string; name: string; unit: string; stockQuantity: number; purchasePrice: string; retailPrice: string; currency: string; category?: string; minimumOrderQuantity: number; deliveryDaysMin: number | null; deliveryDaysMax: number | null };
type PreparedRow = { rowNumber: number; rawData: Record<string, unknown>; status: "valid" | "invalid"; normalizedData?: NormalizedRow; errorCode?: string; errorMessage?: string };

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (name: string) => args[args.indexOf(name) + 1];
  const file = get("--file");
  if (!file) throw new Error("--file is required");
  return { file, dryRun: args.includes("--dry-run"), force: args.includes("--force"), deactivateMissing: args.includes("--deactivate-missing"), mapping: get("--mapping") || "imports/mappings/orion.json" };
}

function readRows(file: string, mapping: Mapping): { sheetName: string; headerRow: number; rows: { rowNumber: number; rawData: Record<string, unknown> }[] } {
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheetName = mapping.sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  const headerRow = mapping.headerRow || 1;
  const headers = (matrix[headerRow - 1] ?? []).map((v, idx) => String(v || `__EMPTY_${idx + 1}`).trim());
  const rows = matrix.slice(headerRow).map((row, offset) => ({ rowNumber: headerRow + 1 + offset, rawData: Object.fromEntries(headers.map((h, i) => [h, String((row as unknown[])[i] ?? "").trim()])) })).filter((row) => Object.values(row.rawData).some((v) => String(v).trim()));
  return { sheetName, headerRow, rows: rows.filter((r) => !mapping.skipRows.includes(r.rowNumber)) };
}

function pick(raw: Record<string, unknown>, column: string | null | undefined): unknown { return column ? raw[column] : undefined; }

export function prepareRows(rows: { rowNumber: number; rawData: Record<string, unknown> }[], mapping: Mapping): PreparedRow[] {
  return rows.map(({ rowNumber, rawData }) => {
    const brandRaw = pick(rawData, mapping.columns.brand);
    const articleRaw = pick(rawData, mapping.columns.article);
    const nameRaw = pick(rawData, mapping.columns.name);
    const stockRaw = pick(rawData, mapping.columns.stock);
    const retailRaw = pick(rawData, mapping.columns.retailPrice) ?? pick(rawData, mapping.columns.purchasePrice);
    const purchaseRaw = pick(rawData, mapping.columns.purchasePrice) ?? retailRaw;
    const brand = normalizeBrand(brandRaw).name;
    const articleParts = normalizeArticle(articleRaw);
    const name = normalizeName(nameRaw);
    const price = parsePrice(retailRaw);
    const purchasePrice = parsePrice(purchaseRaw);
    const stock = parseStock(stockRaw);
    const errors: string[] = [];
    if (!brand) errors.push("BRAND_REQUIRED");
    if (!articleParts.article) errors.push("ARTICLE_REQUIRED");
    if (!name) errors.push("NAME_REQUIRED");
    if (!price.ok) errors.push(price.error);
    if (!purchasePrice.ok) errors.push(purchasePrice.error);
    if (!stock.ok) errors.push(stock.error);
    if (errors.length) return { rowNumber, rawData, status: "invalid", errorCode: errors[0], errorMessage: errors.join(", ") };
    return { rowNumber, rawData, status: "valid", normalizedData: { brand, article: articleParts.article, normalizedArticle: articleParts.normalizedArticle, name, unit: normalizeName(pick(rawData, mapping.columns.unit)) || mapping.defaults.unit, stockQuantity: stock.value, purchasePrice: purchasePrice.value, retailPrice: price.value, currency: String(pick(rawData, mapping.columns.currency) || mapping.defaults.currency), category: normalizeName(pick(rawData, mapping.columns.category)), minimumOrderQuantity: Number(pick(rawData, mapping.columns.minimumOrderQuantity) || mapping.defaults.minimumOrderQuantity), deliveryDaysMin: mapping.deliveryRules.defaultDaysMin, deliveryDaysMax: mapping.deliveryRules.defaultDaysMax } };
  });
}

function reportPath(sourceFile: string, dryRun: boolean) { fs.mkdirSync("tmp", { recursive: true }); return path.join("tmp", `${dryRun ? "dry-run" : "import"}-${path.basename(sourceFile)}.json`.replace(/[^a-zа-яё0-9_.-]+/giu, "-")); }

async function summarizeExisting(prisma: PrismaClient, prepared: PreparedRow[], mapping: Mapping, sourceHash: string, force: boolean) {
  const supplier = await prisma.supplier.findUnique({ where: { code: mapping.supplier.code } });
  const already = await prisma.priceImport.findFirst({ where: { sourceHash, status: "success" } });
  if (already && !force) return { alreadyImported: true };
  const valid = prepared.filter((r) => r.status === "valid" && r.normalizedData);
  let existingProducts = 0, existingOffers = 0;
  for (const row of valid) {
    const normalized = row.normalizedData!;
    const brand = await prisma.brand.findUnique({ where: { normalizedName: normalizeBrand(normalized.brand).normalizedName } });
    if (brand) {
      const product = await prisma.product.findUnique({ where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: normalized.normalizedArticle } } });
      if (product) existingProducts++;
    }
    if (supplier) {
      const offer = await prisma.supplierOffer.findFirst({ where: { supplierId: supplier.id, supplierArticle: normalized.article } });
      if (offer) existingOffers++;
    }
  }
  return { alreadyImported: false, wouldCreateProducts: valid.length - existingProducts, wouldUpdateProducts: existingProducts, wouldCreateOffers: valid.length - existingOffers, wouldUpdateOffers: existingOffers };
}

async function run() {
  const args = parseArgs();
  const mapping = JSON.parse(fs.readFileSync(args.mapping, "utf8")) as Mapping;
  const sourceHash = sha256File(args.file);
  const { sheetName, headerRow, rows } = readRows(args.file, mapping);
  const prepared = prepareRows(rows, mapping);
  const validRows = prepared.filter((r) => r.status === "valid").length;
  const invalidRows = prepared.length - validRows;
  const prisma = new PrismaClient();
  const existing = await summarizeExisting(prisma, prepared, mapping, sourceHash, args.force);
  if (existing.alreadyImported) { console.log("ALREADY_IMPORTED"); await prisma.$disconnect(); return; }
  const baseReport = { sourceFilename: path.basename(args.file), sourceHash, sheetName, headerRow, totalRows: prepared.length, validRows, invalidRows, uniqueBrands: new Set(prepared.flatMap((r) => r.normalizedData?.brand ? [r.normalizedData.brand] : [])).size, uniqueProducts: new Set(prepared.flatMap((r) => r.normalizedData ? [productIdentity(r.normalizedData.brand, r.normalizedData.article)] : [])).size, firstErrors: prepared.filter((r) => r.status === "invalid").slice(0, 20).map((r) => ({ rowNumber: r.rowNumber, errorCode: r.errorCode, errorMessage: r.errorMessage })), ...existing };
  if (args.dryRun) { const out = reportPath(args.file, true); fs.writeFileSync(out, JSON.stringify(baseReport, null, 2)); console.log(JSON.stringify({ ...baseReport, reportPath: out }, null, 2)); await prisma.$disconnect(); return; }
  const startedAt = new Date();
  const supplier = await prisma.supplier.upsert({ where: { code: mapping.supplier.code }, update: { name: mapping.supplier.name, isActive: true }, create: { code: mapping.supplier.code, name: mapping.supplier.name } });
  const warehouse = await prisma.warehouse.upsert({ where: { supplierId_code: { supplierId: supplier.id, code: mapping.warehouse.code } }, update: { name: mapping.warehouse.name, city: mapping.warehouse.city }, create: { supplierId: supplier.id, code: mapping.warehouse.code, name: mapping.warehouse.name, city: mapping.warehouse.city } });
  let createdProducts = 0, updatedProducts = 0, createdOffers = 0, updatedOffers = 0;
  const importRecord = await prisma.priceImport.create({ data: { supplierId: supplier.id, sourceFilename: path.basename(args.file), sourceHash, status: "running", totalRows: prepared.length, validRows, invalidRows, startedAt } });
  try {
    for (const chunkStart of Array.from({ length: Math.ceil(prepared.length / 200) }, (_, i) => i * 200)) {
      const chunk = prepared.slice(chunkStart, chunkStart + 200);
      await prisma.$transaction(async (tx) => {
        for (const row of chunk) {
          if (row.status === "invalid") { await tx.priceImportRow.create({ data: { importId: importRecord.id, rowNumber: row.rowNumber, rawData: row.rawData, status: "invalid", errorCode: row.errorCode, errorMessage: row.errorMessage } }); continue; }
          const n = row.normalizedData!;
          const brandNorm = normalizeBrand(n.brand);
          const brand = await tx.brand.upsert({ where: { normalizedName: brandNorm.normalizedName }, update: { name: brandNorm.name, slug: slugify(brandNorm.name) }, create: { name: brandNorm.name, normalizedName: brandNorm.normalizedName, slug: slugify(brandNorm.name) } });
          const existingProduct = await tx.product.findUnique({ where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: n.normalizedArticle } } });
          const bestName = existingProduct ? chooseBestName([existingProduct.name, n.name]).name : n.name;
          const product = await tx.product.upsert({ where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: n.normalizedArticle } }, update: { name: bestName, unit: n.unit }, create: { sku: `${brandNorm.normalizedName}-${n.normalizedArticle}`.slice(0, 80), article: n.article, normalizedArticle: n.normalizedArticle, name: n.name, slug: slugify(`${brandNorm.name}-${n.article}-${n.name}`), brandId: brand.id, unit: n.unit } });
          existingProduct ? updatedProducts++ : createdProducts++;
          const existingOffer = await tx.supplierOffer.findUnique({ where: { supplierId_warehouseId_supplierArticle: { supplierId: supplier.id, warehouseId: warehouse.id, supplierArticle: n.article } } });
          const offer = await tx.supplierOffer.upsert({ where: { supplierId_warehouseId_supplierArticle: { supplierId: supplier.id, warehouseId: warehouse.id, supplierArticle: n.article } }, update: { productId: product.id, purchasePrice: n.purchasePrice, retailPrice: n.retailPrice, currency: n.currency, stockQuantity: n.stockQuantity, minimumOrderQuantity: n.minimumOrderQuantity, deliveryDaysMin: n.deliveryDaysMin, deliveryDaysMax: n.deliveryDaysMax, sourceUpdatedAt: new Date(), isActive: true }, create: { productId: product.id, supplierId: supplier.id, warehouseId: warehouse.id, supplierArticle: n.article, purchasePrice: n.purchasePrice, retailPrice: n.retailPrice, currency: n.currency, stockQuantity: n.stockQuantity, minimumOrderQuantity: n.minimumOrderQuantity, deliveryDaysMin: n.deliveryDaysMin, deliveryDaysMax: n.deliveryDaysMax, sourceUpdatedAt: new Date() } });
          existingOffer ? updatedOffers++ : createdOffers++;
          await tx.priceImportRow.create({ data: { importId: importRecord.id, rowNumber: row.rowNumber, rawData: row.rawData, normalizedData: n as unknown as object, status: "valid", productId: product.id, offerId: offer.id } });
        }
      });
    }
    await prisma.priceImport.update({ where: { id: importRecord.id }, data: { status: "success", createdProducts, updatedProducts, createdOffers, updatedOffers, finishedAt: new Date() } });
    if (args.deactivateMissing) {
      // Explicit flag accepted for future full snapshots. Current importer keeps offers active until a later reconciliation module owns deactivation safely.
    }
    const out = reportPath(args.file, false); fs.writeFileSync(out, JSON.stringify({ ...baseReport, createdProducts, updatedProducts, createdOffers, updatedOffers, durationMs: Date.now() - startedAt.getTime() }, null, 2));
    console.log(JSON.stringify({ ...baseReport, createdProducts, updatedProducts, createdOffers, updatedOffers, reportPath: out }, null, 2));
  } catch (error) {
    await prisma.priceImport.update({ where: { id: importRecord.id }, data: { status: "failed", errorMessage: error instanceof Error ? error.message : String(error), finishedAt: new Date() } });
    throw error;
  } finally { await prisma.$disconnect(); }
}

if (process.argv[1]?.endsWith("import-orion-price.ts")) run().catch((error) => { console.error(error); process.exit(1); });
