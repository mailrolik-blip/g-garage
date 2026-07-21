import fs from "node:fs";
import path from "node:path";
import XLSX from "xlsx";
import { Prisma, PrismaClient } from "@prisma/client";
import { sha256File } from "../src/lib/normalize.js";
import { loadBrandAliases } from "../src/modules/imports/brand-extractor.js";
import { findMatch, prepareStagingRow, summarizePrepared, type ImportMapping, type RawRow } from "../src/modules/imports/staging.js";

type Args = { file: string; dryRun: boolean; force: boolean; deactivateMissing: boolean; mapping: string };

function parseArgs(): Args {
  const args = process.argv.slice(2);
  const get = (name: string) => {
    const index = args.indexOf(name);
    return index === -1 ? undefined : args[index + 1];
  };
  const file = get("--file");
  if (!file) throw new Error("--file is required");
  return {
    file,
    dryRun: args.includes("--dry-run"),
    force: args.includes("--force"),
    deactivateMissing: args.includes("--deactivate-missing"),
    mapping: get("--mapping") || "imports/mappings/orion.json",
  };
}

function readRows(file: string, mapping: ImportMapping): { sheetName: string; headerRow: number; rows: RawRow[] } {
  const workbook = XLSX.readFile(file, { cellDates: true, cellFormula: true, cellStyles: true, cellHTML: false });
  const sheetName = mapping.sheetName || workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) throw new Error(`Sheet not found: ${sheetName}`);
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
  const headerRow = mapping.headerRow || 1;
  const headers = (matrix[headerRow - 1] ?? []).map((value, idx) => String(value || `__EMPTY_${idx + 1}`).trim());
  const rows = matrix
    .slice(headerRow)
    .map((row, offset) => ({
      rowNumber: headerRow + 1 + offset,
      rawData: Object.fromEntries(headers.map((header, i) => [header, String((row as unknown[])[i] ?? "").trim()])),
    }))
    .filter((row) => Object.values(row.rawData).some((value) => String(value).trim()))
    .filter((row) => !mapping.skipRows.includes(row.rowNumber));
  return { sheetName, headerRow, rows };
}

function reportPath(sourceFile: string, dryRun: boolean) {
  fs.mkdirSync("tmp", { recursive: true });
  const safeName = path.basename(sourceFile).replace(/[^a-z0-9_.-]+/gi, "-");
  return path.join("tmp", `${dryRun ? "dry-run" : "staging-import"}-${safeName}.json`);
}

async function ensureSupplier(prisma: PrismaClient, mapping: ImportMapping) {
  const supplier = await prisma.supplier.upsert({
    where: { code: mapping.supplier.code },
    update: { name: mapping.supplier.name, isActive: true },
    create: { code: mapping.supplier.code, name: mapping.supplier.name },
  });
  const warehouse = await prisma.warehouse.upsert({
    where: { supplierId_code: { supplierId: supplier.id, code: mapping.warehouse.code } },
    update: { name: mapping.warehouse.name, city: mapping.warehouse.city },
    create: { supplierId: supplier.id, code: mapping.warehouse.code, name: mapping.warehouse.name, city: mapping.warehouse.city },
  });
  return { supplier, warehouse };
}

async function buildPrepared(prisma: PrismaClient, args: Args, mapping: ImportMapping) {
  const aliases = loadBrandAliases();
  const { supplier, warehouse } = await ensureSupplier(prisma, mapping);
  const { sheetName, headerRow, rows } = readRows(args.file, mapping);
  const prepared = rows.map((row) => prepareStagingRow({ row, mapping, supplierId: supplier.id, warehouseId: warehouse.id, aliases }));
  return { supplier, warehouse, sheetName, headerRow, rows, prepared };
}

async function summarizeMatches(prisma: PrismaClient, supplierId: string, prepared: Awaited<ReturnType<typeof buildPrepared>>["prepared"]) {
  let autoMatched = 0;
  let needsReview = 0;
  let unmatched = 0;
  let rejected = 0;
  for (const row of prepared) {
    if (row.matchingStatus === "REJECTED") {
      rejected++;
      continue;
    }
    const match = await findMatch(prisma, supplierId, row);
    if (match.productId && match.status === "AUTO_MATCHED") autoMatched++;
    else if (match.status === "NEEDS_REVIEW") needsReview++;
    else unmatched++;
  }
  return { autoMatched, manualMatched: 0, needsReview, unmatched, rejected };
}

async function run() {
  const args = parseArgs();
  const mapping = JSON.parse(fs.readFileSync(args.mapping, "utf8")) as ImportMapping;
  const sourceHash = sha256File(args.file);
  const prisma = new PrismaClient();
  const startedAt = new Date();
  try {
    const preparedData = await buildPrepared(prisma, args, mapping);
    const existing = await prisma.priceImport.findFirst({ where: { sourceHash, status: "success", supplierId: preparedData.supplier.id }, include: { catalogItems: true } });
    if (existing && existing.catalogItems.length > 0 && !args.force) {
      console.log("ALREADY_IMPORTED");
      return;
    }
    const stagingStats = summarizePrepared(preparedData.prepared);
    const matchStats = await summarizeMatches(prisma, preparedData.supplier.id, preparedData.prepared);
    const duplicateSourceKey = preparedData.prepared.length - new Set(preparedData.prepared.map((row) => row.sourceKey)).size;
    const baseReport = {
      sourceFilename: path.basename(args.file),
      sourceHash,
      sheetName: preparedData.sheetName,
      headerRow: preparedData.headerRow,
      ...stagingStats,
      duplicateSourceKey,
      futureSupplierCatalogItems: stagingStats.stagingValid,
      futureAutoMatch: matchStats.autoMatched,
      needsReview: matchStats.needsReview,
      rejected: matchStats.rejected,
      unmatched: matchStats.unmatched,
    };
    if (args.dryRun) {
      const out = reportPath(args.file, true);
      fs.writeFileSync(out, JSON.stringify(baseReport, null, 2));
      console.log(JSON.stringify({ ...baseReport, reportPath: out }, null, 2));
      return;
    }

    const importRecord = await prisma.priceImport.create({
      data: {
        supplierId: preparedData.supplier.id,
        sourceFilename: path.basename(args.file),
        sourceHash,
        status: "running",
        totalRows: preparedData.prepared.length,
        validRows: stagingStats.stagingValid,
        invalidRows: stagingStats.stagingRejected,
        startedAt,
      },
    });

    let stagingCreated = 0;
    let stagingUpdated = 0;
    let autoMatched = 0;
    let needsReview = 0;
    let unmatched = 0;
    let rejected = 0;
    let createdOffers = 0;
    let updatedOffers = 0;

    for (const chunkStart of Array.from({ length: Math.ceil(preparedData.prepared.length / 150) }, (_, i) => i * 150)) {
      const chunk = preparedData.prepared.slice(chunkStart, chunkStart + 150);
      await prisma.$transaction(async (tx) => {
        for (const row of chunk) {
          const match = row.matchingStatus === "REJECTED" ? null : await findMatch(tx as unknown as PrismaClient, preparedData.supplier.id, row);
          const finalStatus = row.matchingStatus === "REJECTED" ? "REJECTED" : match?.status ?? row.matchingStatus;
          const existingItem = await tx.supplierCatalogItem.findUnique({
            where: { supplierId_warehouseId_sourceKey: { supplierId: preparedData.supplier.id, warehouseId: preparedData.warehouse.id, sourceKey: row.sourceKey } },
          });
          const item = await tx.supplierCatalogItem.upsert({
            where: { supplierId_warehouseId_sourceKey: { supplierId: preparedData.supplier.id, warehouseId: preparedData.warehouse.id, sourceKey: row.sourceKey } },
            update: {
              sourceArticle: row.sourceArticle,
              normalizedSourceArticle: row.normalizedSourceArticle,
              sourceName: row.sourceName,
              normalizedSourceName: row.normalizedSourceName,
              sourceBrand: row.sourceBrand,
              sourceCategory: row.sourceCategory,
              sourceUnit: row.sourceUnit,
              sourceStockRaw: row.sourceStockRaw,
              sourcePriceRaw: row.sourcePriceRaw,
              purchasePrice: row.purchasePrice,
              retailPrice: row.retailPrice,
              currency: row.currency,
              stockQuantity: row.stockQuantity,
              deliveryDaysMin: row.deliveryDaysMin,
              deliveryDaysMax: row.deliveryDaysMax,
              minimumOrderQuantity: row.minimumOrderQuantity,
              rawData: row.rawData as Prisma.InputJsonValue,
              sourceRowNumber: row.rowNumber,
              sourceUpdatedAt: new Date(),
              lastImportId: importRecord.id,
              matchingStatus: finalStatus,
              matchedProductId: match?.productId,
              matchingConfidence: match?.confidence,
              matchingMethod: match?.method ?? row.matchingMethod,
              isActive: true,
            },
            create: {
              supplierId: preparedData.supplier.id,
              warehouseId: preparedData.warehouse.id,
              sourceKey: row.sourceKey,
              sourceArticle: row.sourceArticle,
              normalizedSourceArticle: row.normalizedSourceArticle,
              sourceName: row.sourceName,
              normalizedSourceName: row.normalizedSourceName,
              sourceBrand: row.sourceBrand,
              sourceCategory: row.sourceCategory,
              sourceUnit: row.sourceUnit,
              sourceStockRaw: row.sourceStockRaw,
              sourcePriceRaw: row.sourcePriceRaw,
              purchasePrice: row.purchasePrice,
              retailPrice: row.retailPrice,
              currency: row.currency,
              stockQuantity: row.stockQuantity,
              deliveryDaysMin: row.deliveryDaysMin,
              deliveryDaysMax: row.deliveryDaysMax,
              minimumOrderQuantity: row.minimumOrderQuantity,
              rawData: row.rawData as Prisma.InputJsonValue,
              sourceRowNumber: row.rowNumber,
              sourceUpdatedAt: new Date(),
              lastImportId: importRecord.id,
              matchingStatus: finalStatus,
              matchedProductId: match?.productId,
              matchingConfidence: match?.confidence,
              matchingMethod: match?.method ?? row.matchingMethod,
            },
          });
          if (existingItem) stagingUpdated++; else stagingCreated++;

          await tx.priceImportRow.create({
            data: {
              importId: importRecord.id,
              rowNumber: row.rowNumber,
              rawData: row.rawData as Prisma.InputJsonValue,
              normalizedData: { sourceKey: row.sourceKey, sourceArticle: row.sourceArticle, sourceName: row.sourceName, sourceBrand: row.sourceBrand } as Prisma.InputJsonValue,
              status: finalStatus,
              productId: match?.productId,
            },
          });

          for (const issue of row.issues) {
            await tx.importReviewIssue.create({
              data: { importId: importRecord.id, supplierCatalogItemId: item.id, code: issue.code, severity: issue.severity, message: issue.message, details: issue.details as Prisma.InputJsonValue | undefined },
            });
          }
          if (finalStatus === "REJECTED") rejected++;
          else if (finalStatus === "AUTO_MATCHED") autoMatched++;
          else if (finalStatus === "NEEDS_REVIEW") needsReview++;
          else unmatched++;

          for (const candidate of match?.candidates ?? []) {
            await tx.productMatchCandidate.upsert({
              where: { supplierCatalogItemId_productId: { supplierCatalogItemId: item.id, productId: candidate.productId } },
              update: { score: candidate.score, reasons: candidate.reasons as Prisma.InputJsonValue, status: "SUGGESTED" },
              create: { supplierCatalogItemId: item.id, productId: candidate.productId, score: candidate.score, reasons: candidate.reasons as Prisma.InputJsonValue },
            });
          }

          if (match?.productId && row.retailPrice && row.purchasePrice && row.sourceArticle) {
            const existingOffer = await tx.supplierOffer.findUnique({ where: { supplierId_warehouseId_supplierArticle: { supplierId: preparedData.supplier.id, warehouseId: preparedData.warehouse.id, supplierArticle: row.sourceArticle } } });
            await tx.supplierOffer.upsert({
              where: { supplierId_warehouseId_supplierArticle: { supplierId: preparedData.supplier.id, warehouseId: preparedData.warehouse.id, supplierArticle: row.sourceArticle } },
              update: {
                productId: match.productId,
                supplierCatalogItemId: item.id,
                purchasePrice: row.purchasePrice,
                retailPrice: row.retailPrice,
                currency: row.currency,
                stockQuantity: row.stockQuantity ?? 0,
                minimumOrderQuantity: row.minimumOrderQuantity,
                deliveryDaysMin: row.deliveryDaysMin,
                deliveryDaysMax: row.deliveryDaysMax,
                sourceUpdatedAt: new Date(),
                matchedAt: new Date(),
                matchingMethod: match.method,
                isActive: true,
              },
              create: {
                productId: match.productId,
                supplierId: preparedData.supplier.id,
                warehouseId: preparedData.warehouse.id,
                supplierCatalogItemId: item.id,
                supplierArticle: row.sourceArticle,
                purchasePrice: row.purchasePrice,
                retailPrice: row.retailPrice,
                currency: row.currency,
                stockQuantity: row.stockQuantity ?? 0,
                minimumOrderQuantity: row.minimumOrderQuantity,
                deliveryDaysMin: row.deliveryDaysMin,
                deliveryDaysMax: row.deliveryDaysMax,
                sourceUpdatedAt: new Date(),
                matchedAt: new Date(),
                matchingMethod: match.method,
              },
            });
            if (existingOffer) updatedOffers++; else createdOffers++;
          }
        }
      });
    }

    await prisma.priceImport.update({
      where: { id: importRecord.id },
      data: { status: "success", createdOffers, updatedOffers, finishedAt: new Date() },
    });
    if (args.deactivateMissing) {
      // Explicitly accepted, but full snapshot reconciliation is intentionally deferred.
    }
    const result = { ...baseReport, stagingCreated, stagingUpdated, autoMatched, manualMatched: 0, needsReview, unmatched, rejected, createdProducts: 0, updatedProducts: 0, createdOffers, updatedOffers, durationMs: Date.now() - startedAt.getTime() };
    const out = reportPath(args.file, false);
    fs.writeFileSync(out, JSON.stringify(result, null, 2));
    console.log(JSON.stringify({ ...result, reportPath: out }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1]?.endsWith("import-orion-price.ts")) run().catch((error) => { console.error(error); process.exit(1); });