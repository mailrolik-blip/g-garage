import type { MatchingMethod, PrismaClient } from "@prisma/client";
import { normalizeArticle } from "../../lib/normalize.js";

export async function createOfferFromMatchedItem(prisma: PrismaClient, itemId: string, productId: string, method: MatchingMethod = "MANUAL") {
  const item = await prisma.supplierCatalogItem.findUniqueOrThrow({ where: { id: itemId } });
  if (!item.sourceArticle || !item.warehouseId || !item.retailPrice || !item.purchasePrice) {
    throw new Error("Matched item needs sourceArticle, warehouseId, retailPrice and purchasePrice before offer creation");
  }
  return prisma.supplierOffer.upsert({
    where: { supplierId_warehouseId_supplierArticle: { supplierId: item.supplierId, warehouseId: item.warehouseId, supplierArticle: item.sourceArticle } },
    update: { productId, supplierCatalogItemId: item.id, retailPrice: item.retailPrice, purchasePrice: item.purchasePrice, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, matchedAt: new Date(), matchingMethod: method, isActive: true },
    create: { productId, supplierId: item.supplierId, warehouseId: item.warehouseId, supplierCatalogItemId: item.id, supplierArticle: item.sourceArticle, retailPrice: item.retailPrice, purchasePrice: item.purchasePrice, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, matchedAt: new Date(), matchingMethod: method },
  });
}

export async function applyManualMatch(prisma: PrismaClient, itemId: string, productId: string, note?: string) {
  const item = await prisma.supplierCatalogItem.update({ where: { id: itemId }, data: { matchedProductId: productId, matchingStatus: "MANUAL_MATCHED", matchingMethod: "MANUAL", matchingConfidence: "100.00" } });
  if (item.sourceArticle) {
    await prisma.supplierProductMapping.upsert({
      where: { supplierId_normalizedSourceArticle_productId: { supplierId: item.supplierId, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, productId } },
      update: { sourceName: item.sourceName, confidence: "100.00", note, createdBy: "catalog:review", isActive: true },
      create: { supplierId: item.supplierId, sourceArticle: item.sourceArticle, normalizedSourceArticle: normalizeArticle(item.sourceArticle).normalizedArticle, sourceName: item.sourceName, productId, confidence: "100.00", createdBy: "catalog:review", note },
    });
  }
  await createOfferFromMatchedItem(prisma, itemId, productId, "MANUAL");
  await prisma.productMatchCandidate.updateMany({ where: { supplierCatalogItemId: itemId, productId }, data: { status: "ACCEPTED" } });
  return item;
}

export async function rejectSupplierItem(prisma: PrismaClient, itemId: string, reason: string) {
  const item = await prisma.supplierCatalogItem.update({ where: { id: itemId }, data: { matchingStatus: "REJECTED", matchingMethod: "MANUAL", isActive: false } });
  if (item.lastImportId) await prisma.importReviewIssue.create({ data: { importId: item.lastImportId, supplierCatalogItemId: item.id, code: "MANUAL_REJECT", severity: "INFO", message: reason } });
  await prisma.supplierOffer.updateMany({ where: { supplierCatalogItemId: item.id }, data: { isActive: false } });
  return item;
}

export async function unmatchSupplierItem(prisma: PrismaClient, itemId: string) {
  const item = await prisma.supplierCatalogItem.update({ where: { id: itemId }, data: { matchedProductId: null, matchingStatus: "UNMATCHED", matchingMethod: "NONE", matchingConfidence: null } });
  await prisma.supplierOffer.updateMany({ where: { supplierCatalogItemId: item.id }, data: { isActive: false } });
  await prisma.productMatchCandidate.updateMany({ where: { supplierCatalogItemId: item.id, status: "ACCEPTED" }, data: { status: "REJECTED" } });
  return item;
}