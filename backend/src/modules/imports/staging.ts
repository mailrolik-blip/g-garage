import type { PrismaClient, MatchingMethod, MatchingStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";
import { normalizeArticle, normalizeBrand, normalizeName, parsePrice, parseStock } from "../../lib/normalize.js";
import { buildSourceKey } from "./source-key.js";
import { extractBrandFromName, type BrandAliases } from "./brand-extractor.js";

export type ImportMapping = {
  supplier: { name: string; code: string };
  warehouse: { name: string; code: string; city: string | null };
  sheetName: string | null;
  headerRow: number | null;
  columns: Record<string, string | null>;
  defaults: { currency: string; unit: string; minimumOrderQuantity: number };
  deliveryRules: { defaultDaysMin: number | null; defaultDaysMax: number | null };
  skipRows: number[];
};

export type RawRow = { rowNumber: number; rawData: Record<string, unknown> };
export type ReviewIssue = { code: string; severity: "INFO" | "WARNING" | "ERROR"; message: string; details?: Record<string, unknown> };
export type PreparedStagingRow = {
  rowNumber: number;
  rawData: Record<string, unknown>;
  sourceKey: string;
  sourceArticle: string | null;
  normalizedSourceArticle: string | null;
  sourceName: string | null;
  normalizedSourceName: string | null;
  sourceBrand: string | null;
  sourceCategory: string | null;
  sourceUnit: string | null;
  sourceStockRaw: string | null;
  sourcePriceRaw: string | null;
  purchasePrice: string | null;
  retailPrice: string | null;
  currency: string;
  stockQuantity: number | null;
  deliveryDaysMin: number | null;
  deliveryDaysMax: number | null;
  minimumOrderQuantity: number;
  matchingStatus: MatchingStatus;
  matchingMethod: MatchingMethod;
  matchingConfidence: string | null;
  issues: ReviewIssue[];
};

function pick(raw: Record<string, unknown>, column: string | null | undefined): unknown {
  return column ? raw[column] : undefined;
}

function textOrNull(value: unknown): string | null {
  const text = normalizeName(value);
  return text || null;
}

export function prepareStagingRow(input: {
  row: RawRow;
  mapping: ImportMapping;
  supplierId: string;
  warehouseId: string | null;
  aliases: BrandAliases;
}): PreparedStagingRow {
  const { row, mapping, supplierId, warehouseId, aliases } = input;
  const sourceArticle = textOrNull(pick(row.rawData, mapping.columns.article));
  const articleParts = normalizeArticle(sourceArticle);
  const sourceName = textOrNull(pick(row.rawData, mapping.columns.name));
  const normalizedSourceName = sourceName ? sourceName.toUpperCase() : null;
  const mappedBrand = textOrNull(pick(row.rawData, mapping.columns.brand));
  const extracted = extractBrandFromName(sourceName, aliases);
  const sourceBrand = mappedBrand ? normalizeBrand(mappedBrand).normalizedName : extracted.status === "single" ? extracted.brand : null;
  const sourceStockRaw = textOrNull(pick(row.rawData, mapping.columns.stock));
  const sourcePriceRaw = textOrNull(pick(row.rawData, mapping.columns.retailPrice) ?? pick(row.rawData, mapping.columns.purchasePrice));
  const purchaseRaw = pick(row.rawData, mapping.columns.purchasePrice) ?? sourcePriceRaw;
  const stock = sourceStockRaw === null ? null : parseStock(sourceStockRaw);
  const price = sourcePriceRaw === null ? null : parsePrice(sourcePriceRaw);
  const purchasePrice = purchaseRaw === null || purchaseRaw === undefined || purchaseRaw === "" ? price : parsePrice(purchaseRaw);
  const issues: ReviewIssue[] = [];
  let matchingStatus: MatchingStatus = "UNMATCHED";

  if (!sourceArticle && !sourceName) {
    matchingStatus = "REJECTED";
    issues.push({ code: "MINIMAL_DATA_MISSING", severity: "ERROR", message: "Row has neither article nor name" });
  }
  if (!sourceArticle) issues.push({ code: "ARTICLE_MISSING", severity: "WARNING", message: "Supplier article is missing" });
  if (!sourceName) issues.push({ code: "NAME_MISSING", severity: "WARNING", message: "Supplier name is missing" });
  if (!sourceBrand) issues.push({ code: "BRAND_MISSING", severity: "WARNING", message: "Brand is not present or confidently extracted" });
  if (extracted.status === "multiple") {
    matchingStatus = "NEEDS_REVIEW";
    issues.push({ code: "BRAND_AMBIGUOUS", severity: "WARNING", message: "Multiple brand aliases matched", details: { aliases: extracted.aliases } });
  }
  if (!price) issues.push({ code: "PRICE_MISSING", severity: "WARNING", message: "Price is missing" });
  else if (!price.ok) {
    matchingStatus = matchingStatus === "REJECTED" ? "REJECTED" : "NEEDS_REVIEW";
    issues.push({ code: price.error, severity: "ERROR", message: "Price cannot be normalized" });
  }
  if (stock && !stock.ok) issues.push({ code: stock.error, severity: "WARNING", message: "Stock cannot be normalized" });

  return {
    rowNumber: row.rowNumber,
    rawData: row.rawData,
    sourceKey: buildSourceKey({ supplierId, warehouseId, sourceArticle, sourceName, rowContext: String(row.rowNumber) }),
    sourceArticle,
    normalizedSourceArticle: articleParts.normalizedArticle || null,
    sourceName,
    normalizedSourceName,
    sourceBrand,
    sourceCategory: textOrNull(pick(row.rawData, mapping.columns.category)),
    sourceUnit: textOrNull(pick(row.rawData, mapping.columns.unit)) ?? mapping.defaults.unit,
    sourceStockRaw,
    sourcePriceRaw,
    purchasePrice: purchasePrice?.ok ? purchasePrice.value : null,
    retailPrice: price?.ok ? price.value : null,
    currency: String(pick(row.rawData, mapping.columns.currency) || mapping.defaults.currency),
    stockQuantity: stock?.ok ? stock.value : null,
    deliveryDaysMin: mapping.deliveryRules.defaultDaysMin,
    deliveryDaysMax: mapping.deliveryRules.defaultDaysMax,
    minimumOrderQuantity: Number(pick(row.rawData, mapping.columns.minimumOrderQuantity) || mapping.defaults.minimumOrderQuantity),
    matchingStatus,
    matchingMethod: "NONE",
    matchingConfidence: null,
    issues,
  };
}

export function summarizePrepared(rows: PreparedStagingRow[]) {
  return {
    totalRows: rows.length,
    stagingValid: rows.filter((row) => row.matchingStatus !== "REJECTED").length,
    stagingRejected: rows.filter((row) => row.matchingStatus === "REJECTED").length,
    withArticle: rows.filter((row) => row.sourceArticle).length,
    withoutArticle: rows.filter((row) => !row.sourceArticle).length,
    withName: rows.filter((row) => row.sourceName).length,
    withoutName: rows.filter((row) => !row.sourceName).length,
    brandDetected: rows.filter((row) => row.sourceBrand).length,
    brandMissing: rows.filter((row) => !row.sourceBrand).length,
  };
}

export async function findMatch(prisma: PrismaClient | Prisma.TransactionClient, supplierId: string, row: PreparedStagingRow) {
  if (!row.normalizedSourceArticle) return { productId: null, status: row.matchingStatus, method: "NONE" as MatchingMethod, confidence: null, candidates: [] as { productId: string; score: string; reasons: string[] }[] };

  const mapping = await prisma.supplierProductMapping.findFirst({
    where: { supplierId, normalizedSourceArticle: row.normalizedSourceArticle, isActive: true },
    orderBy: { confidence: "desc" },
  });
  if (mapping) return { productId: mapping.productId, status: "AUTO_MATCHED" as MatchingStatus, method: "EXACT_SOURCE_MAPPING" as MatchingMethod, confidence: mapping.confidence.toString(), candidates: [] };

  if (row.sourceBrand) {
    const brand = await prisma.brand.findUnique({ where: { normalizedName: row.sourceBrand } });
    if (brand) {
      const product = await prisma.product.findUnique({ where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle: row.normalizedSourceArticle } } });
      if (product) return { productId: product.id, status: "AUTO_MATCHED" as MatchingStatus, method: "EXACT_BRAND_ARTICLE" as MatchingMethod, confidence: "100.00", candidates: [] };
    }
  }

  const articleCandidates = await prisma.product.findMany({
    where: { normalizedArticle: row.normalizedSourceArticle, isActive: true },
    include: { brand: true },
    take: 10,
  });
  const candidates = articleCandidates.map((product) => {
    const sameBrand = row.sourceBrand && product.brand.normalizedName === row.sourceBrand;
    const nameHit = row.sourceName ? product.name.toUpperCase().includes(row.sourceName.split(/\s+/)[0]?.toUpperCase() ?? "") : false;
    const score = sameBrand ? 100 : nameHit ? 72 : 60;
    const reasons = ["ARTICLE_MATCH", sameBrand ? "BRAND_MATCH" : "BRAND_NOT_CONFIRMED", nameHit ? "NAME_TOKEN_MATCH" : "NAME_WEAK"].filter(Boolean);
    return { productId: product.id, score: score.toFixed(2), reasons };
  });
  return { productId: null, status: candidates.length ? "NEEDS_REVIEW" as MatchingStatus : row.matchingStatus, method: "ARTICLE_NAME" as MatchingMethod, confidence: null, candidates };
}