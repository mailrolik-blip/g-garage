import { PrismaClient, type EnrichmentCandidate, type EnrichmentDecision, type Prisma } from "@prisma/client";
import { normalizeArticle, normalizeBrand, normalizeName, slugify } from "../src/lib/normalize.js";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function has(name: string) { return args.includes(name); }

type CandidateWithRelations = EnrichmentCandidate & {
  supplierCatalogItem: { id: string; supplierId: string; warehouseId: string | null; sourceArticle: string | null; sourceName: string | null; purchasePrice: Prisma.Decimal | null; retailPrice: Prisma.Decimal | null; currency: string; stockQuantity: number | null; minimumOrderQuantity: number; deliveryDaysMin: number | null; deliveryDaysMax: number | null; sourceUpdatedAt: Date | null };
  evidence: { sourceType: string }[];
  decisions: EnrichmentDecision[];
};

function latestAccept(candidate: CandidateWithRelations) {
  return candidate.decisions.find((decision) => decision.decision === "ACCEPT") ?? null;
}

function canApply(candidate: CandidateWithRelations) {
  const accept = latestAccept(candidate);
  const statusOk = candidate.status === "CONFIRMED" || Boolean(accept);
  const confidence = Number(candidate.confidence ?? 0);
  const marketplaceOnly = candidate.evidence.length > 0 && candidate.evidence.every((evidence) => evidence.sourceType === "MARKETPLACE");
  const missing = [candidate.proposedBrand, candidate.proposedArticle, candidate.proposedName].filter((value) => !normalizeName(value).length);
  const item = candidate.supplierCatalogItem;
  const offerReady = Boolean(item.sourceArticle && item.warehouseId && item.purchasePrice && item.retailPrice);
  if (!statusOk) return { ok: false, reason: "candidate is not confirmed or accepted" };
  if (confidence < 90) return { ok: false, reason: "confidence below 90" };
  if (candidate.conflictReason) return { ok: false, reason: "candidate has conflict" };
  if (marketplaceOnly) return { ok: false, reason: "marketplace-only evidence" };
  if (missing.length) return { ok: false, reason: "brand/article/name is missing" };
  if (!offerReady) return { ok: false, reason: "supplier item cannot create offer" };
  return { ok: true, reason: "ready" };
}

async function uniqueSlug(base: string, model: "brand" | "category" | "product") {
  let slug = slugify(base);
  for (let index = 2; ; index += 1) {
    const exists = model === "brand"
      ? await prisma.brand.findUnique({ where: { slug } })
      : model === "category"
        ? await prisma.category.findUnique({ where: { slug } })
        : await prisma.product.findUnique({ where: { slug } });
    if (!exists) return slug;
    slug = `${slugify(base)}-${index}`;
  }
}

async function ensureBrand(name: string) {
  const normalized = normalizeBrand(name);
  const existing = await prisma.brand.findUnique({ where: { normalizedName: normalized.normalizedName } });
  if (existing) return existing;
  return prisma.brand.create({ data: { name: normalized.name, normalizedName: normalized.normalizedName, slug: await uniqueSlug(normalized.name, "brand") } });
}

async function ensureCategory(name: string | null | undefined) {
  const categoryName = normalizeName(name) || "прочее";
  const existing = await prisma.category.findFirst({ where: { name: { equals: categoryName, mode: "insensitive" } } });
  if (existing) return existing;
  return prisma.category.create({ data: { name: categoryName, slug: await uniqueSlug(categoryName, "category"), isActive: true, sortOrder: 900 } });
}

async function applyCandidate(candidate: CandidateWithRelations) {
  const brand = await ensureBrand(candidate.proposedBrand ?? "");
  const category = await ensureCategory(candidate.proposedCategory);
  const article = normalizeArticle(candidate.proposedArticle).article;
  const normalizedArticle = normalizeArticle(article).normalizedArticle;
  const name = normalizeName(candidate.proposedName);
  const product = await prisma.product.upsert({
    where: { brandId_normalizedArticle: { brandId: brand.id, normalizedArticle } },
    update: { name, categoryId: category.id, unit: candidate.proposedUnit ?? candidate.supplierCatalogItem.sourceArticle, isActive: true },
    create: {
      sku: `ORION-${normalizedArticle}`,
      article,
      normalizedArticle,
      name,
      slug: await uniqueSlug(`${brand.name}-${article}`, "product"),
      description: null,
      brandId: brand.id,
      categoryId: category.id,
      unit: candidate.proposedUnit ?? null,
      qualityLevel: "confirmed",
      isActive: true,
    },
  });
  const item = candidate.supplierCatalogItem;
  await prisma.supplierProductMapping.upsert({
    where: { supplierId_normalizedSourceArticle_productId: { supplierId: item.supplierId, normalizedSourceArticle: normalizeArticle(item.sourceArticle!).normalizedArticle, productId: product.id } },
    update: { sourceName: item.sourceName, confidence: candidate.confidence ?? "90.00", createdBy: "enrich:apply", note: `enrichmentCandidate:${candidate.id}`, isActive: true },
    create: { supplierId: item.supplierId, sourceArticle: item.sourceArticle ?? article, normalizedSourceArticle: normalizeArticle(item.sourceArticle!).normalizedArticle, sourceName: item.sourceName, productId: product.id, confidence: candidate.confidence ?? "90.00", createdBy: "enrich:apply", note: `enrichmentCandidate:${candidate.id}` },
  });
  await prisma.supplierCatalogItem.update({ where: { id: item.id }, data: { matchedProductId: product.id, matchingStatus: "AUTO_MATCHED", matchingConfidence: candidate.confidence ?? "90.00", matchingMethod: "EXACT_SOURCE_MAPPING" } });
  await prisma.supplierOffer.upsert({
    where: { supplierId_warehouseId_supplierArticle: { supplierId: item.supplierId, warehouseId: item.warehouseId!, supplierArticle: item.sourceArticle ?? article } },
    update: { productId: product.id, supplierCatalogItemId: item.id, purchasePrice: item.purchasePrice!, retailPrice: item.retailPrice!, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, sourceUpdatedAt: item.sourceUpdatedAt, matchedAt: new Date(), matchingMethod: "EXACT_SOURCE_MAPPING", isActive: true },
    create: { productId: product.id, supplierId: item.supplierId, warehouseId: item.warehouseId!, supplierCatalogItemId: item.id, supplierArticle: item.sourceArticle ?? article, purchasePrice: item.purchasePrice!, retailPrice: item.retailPrice!, currency: item.currency, stockQuantity: item.stockQuantity ?? 0, minimumOrderQuantity: item.minimumOrderQuantity, deliveryDaysMin: item.deliveryDaysMin, deliveryDaysMax: item.deliveryDaysMax, sourceUpdatedAt: item.sourceUpdatedAt, matchedAt: new Date(), matchingMethod: "EXACT_SOURCE_MAPPING" },
  });
  await prisma.enrichmentDecision.create({ data: { candidateId: candidate.id, decision: "ACCEPT", decidedBy: "enrich:apply", note: "Applied confirmed enrichment candidate", productId: product.id } });
  return product.id;
}

async function main() {
  const jobId = get("--job");
  if (!jobId) throw new Error("--job is required");
  const dryRun = has("--dry-run");
  const candidates = await prisma.enrichmentCandidate.findMany({
    where: { jobId, OR: [{ status: "CONFIRMED" }, { decisions: { some: { decision: "ACCEPT" } } }] },
    include: { supplierCatalogItem: true, evidence: true, decisions: { orderBy: { createdAt: "desc" } } },
  }) as CandidateWithRelations[];
  const eligible = candidates.map((candidate) => ({ candidate, check: canApply(candidate) }));
  const ready = eligible.filter((entry) => entry.check.ok);
  if (!dryRun) {
    for (const entry of ready) await applyCandidate(entry.candidate);
  }
  console.log(JSON.stringify({ jobId, dryRun, checked: candidates.length, applicable: ready.length, skipped: eligible.filter((entry) => !entry.check.ok).map((entry) => ({ candidateId: entry.candidate.id, reason: entry.check.reason })) }, null, 2));
}

main().finally(async () => prisma.$disconnect());

