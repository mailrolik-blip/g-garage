import fs from "node:fs";
import { PrismaClient, type SourceType, type EvidenceType } from "@prisma/client";
import { calculateConfidence, detectConflict, mapCategory, sourceReliability } from "../src/modules/enrichment/confidence.js";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; }

const researched: Record<string, { brand?: string; article: string; name: string; category?: string; oem?: string[]; gtin?: string; sources: Array<{ type: SourceType; url: string; domain: string; title: string; evidence: EvidenceType; brand?: string; article?: string; name?: string; category?: string; notes?: string }>; conflict?: string }> = {
  "81.50110.0144": { article: "81.50110.0144", name: "Барабан тормозной задний", category: "тормозная система", sources: [
    { type: "PARTS_CATALOG", url: "https://www.niparts.com/OEM/1CE937/MAN/81501100144.html", domain: "niparts.com", title: "MAN 81.50110.0144 Brake Drum", evidence: "EXACT_ARTICLE", brand: "MAN", article: "81.50110.0144", name: "Brake Drum", category: "Brake System" },
    { type: "LARGE_RETAILER", url: "https://deruna.com/portfolio-item/shacman-81-50110-0144", domain: "deruna.com", title: "81.50110.0144 Rear Brake Drum", evidence: "EXACT_ARTICLE", brand: "SHACMAN", article: "81.50110.0144", name: "Rear Brake Drum" }
  ], conflict: "Article appears under MAN and SHACMAN sources; requires human review." },
  "612630020222": { brand: "SHACMAN", article: "612630020222", name: "Маховик WP12 Евро-5", category: "трансмиссия", oem: ["612630020006", "612630020051"], sources: [
    { type: "LARGE_RETAILER", url: "https://chinaheavytruckparts.com/portfolio-item/612630020222", domain: "chinaheavytruckparts.com", title: "Shacman Truck Parts-Flywheel Wp12 Euro 5 612630020222", evidence: "EXACT_ARTICLE", brand: "Shacman", article: "612630020222", name: "Flywheel Wp12 Euro 5" },
    { type: "LARGE_RETAILER", url: "https://pnm-parts.ru/catalog/shacman/shacman/612630020222", domain: "pnm-parts.ru", title: "Маховик SHACMAN SHAANXI дв.WP12 OE", evidence: "BRAND_ARTICLE", brand: "Shacman", article: "612630020222", name: "Маховик SHACMAN SHAANXI дв.WP12 OE" }
  ] },
  "DZ14251770030": { brand: "SHACMAN", article: "DZ14251770030", name: "Зеркало левое в сборе X3000 с подогревом", category: "кузов", sources: [
    { type: "LARGE_RETAILER", url: "https://deruna.com/portfolio-item/shacman-dz14251770030", domain: "deruna.com", title: "DZ14251770030 Left Rearview Mirror Assembly", evidence: "EXACT_ARTICLE", brand: "Shacman", article: "DZ14251770030", name: "Left Rearview Mirror Assembly" },
    { type: "LARGE_RETAILER", url: "https://stugs.ru/zerkalo-shaanxi-x3000-v-sbore-levoe-bez-podogreva/", domain: "stugs.ru", title: "Зеркало Shaanxi / SHACMAN X3000", evidence: "BRAND_ARTICLE", brand: "SHACMAN", article: "DZ14251770030", name: "Зеркало левое" },
    { type: "LARGE_RETAILER", url: "https://ati-auto.ru/catalog/weichai/dz14251770030/", domain: "ati-auto.ru", title: "Weichai DZ14251770030", evidence: "EXACT_ARTICLE", brand: "WEICHAI", article: "DZ14251770030", name: "Зеркало заднего вида" }
  ], conflict: "Article is listed under SHACMAN and WEICHAI retail sources; requires human review." },
  "DZ95259450100": { brand: "SHACMAN", article: "DZ95259450100", name: "Бачок расширительный F3000", category: "охлаждение", oem: ["81.06102.6205"], sources: [
    { type: "LARGE_RETAILER", url: "https://deruna.com/portfolio-item/shacman-dz95259450100", domain: "deruna.com", title: "SHACMAN DZ95259450100 Expansion Tank Assembly", evidence: "EXACT_ARTICLE", brand: "SHACMAN", article: "DZ95259450100", name: "Expansion Tank Assembly" },
    { type: "LARGE_RETAILER", url: "https://st-spares.ru/shacman/shacman-sistema-ohlaghdeniya-i-otopleniya/shaanxi-shacman-dz95259450100", domain: "st-spares.ru", title: "Бачок расширительный F3000 SHACMAN DZ95259450100", evidence: "BRAND_ARTICLE", brand: "Shacman", article: "DZ95259450100", name: "Бачок расширительный F3000" }
  ] },
  "DZ9L149585101": { brand: "SHACMAN", article: "DZ9L149585101", name: "Блок управления системой комфорта BCM X6000", category: "электрика", sources: [
    { type: "LARGE_RETAILER", url: "https://www.autoopt.ru/catalog/194002-blok_upravlenija_shacman_shaanxi_x6000_sistemoj_komforta_bcm_oe", domain: "autoopt.ru", title: "Блок управления SHACMAN SHAANXI X6000 системой комфорта", evidence: "EXACT_ARTICLE", brand: "SHACMAN", article: "DZ9L149585101", name: "Блок управления системой комфорта BCM" },
    { type: "PARTS_CATALOG", url: "https://www.cnsinotruk.com/shacman-x5000-x6000-truck-parts/page-2/", domain: "cnsinotruk.com", title: "X6000 Body Control Module DZ9L149585101", evidence: "BRAND_ARTICLE", brand: "SHACMAN", article: "DZ9L149585101", name: "Body Control Module" }
  ] },
  "DZ16251444076": { brand: "SHACMAN", article: "DZ16251444076", name: "Амортизатор кабины задний правый X6000", category: "подвеска", sources: [
    { type: "LARGE_RETAILER", url: "https://www.opex.ru/catalog/offers/594457528/", domain: "opex.ru", title: "Амортизатор кабины задний правый Shacman X6000", evidence: "EXACT_ARTICLE", brand: "SHACMAN", article: "DZ16251444076", name: "Амортизатор кабины задний правый" }
  ] },
  "9F550-45A030001A0": { brand: "LOVOL", article: "9F550-45A030001A0", name: "Переднее стекло FL936H", category: "кузов", sources: [
    { type: "PARTS_CATALOG", url: "https://xgvictorious.com/product/9f560-24a010504a0-gearbox-shaft-foton-lovol", domain: "xgvictorious.com", title: "FOTON LOVOL parts list", evidence: "EXACT_ARTICLE", brand: "LOVOL", article: "9F550-45A030001A0", name: "前玻璃 / front glass" }
  ] },
  "B102-3162815": { brand: "LOVOL", article: "B102-3162815", name: "Шайба регулировочная", category: "прочее", sources: [
    { type: "PARTS_CATALOG", url: "https://es.scribd.com/document/648253745/FR220D-ISUZU-Manual-de-Operacion-y-Mantenimiento-LOVOL", domain: "scribd.com", title: "LOVOL FR220D parts list", evidence: "EXACT_ARTICLE", brand: "LOVOL", article: "B102-3162815", name: "Cuña de ajuste / adjustment shim" }
  ] }
};

function statusFor(confidence: number, conflict: string | null, sourceTypes: SourceType[]) {
  if (conflict) return "NEEDS_REVIEW";
  if (confidence >= 90 && !sourceTypes.every((type) => type === "MARKETPLACE")) return "CONFIRMED";
  if (confidence >= 75) return "NEEDS_REVIEW";
  return "UNRESOLVED";
}

async function ensureJob(jobId?: string) {
  if (jobId) return prisma.enrichmentJob.findUniqueOrThrow({ where: { id: jobId } });
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { code: "ORION" } });
  const sample = JSON.parse(fs.readFileSync("tmp/orion-enrichment-sample.json", "utf8"));
  const job = await prisma.enrichmentJob.create({ data: { supplierId: supplier.id, name: "ORION enrichment pilot 20260721", status: "RESEARCHING", totalItems: sample.items.length, startedAt: new Date() } });
  for (const sampleItem of sample.items) await prisma.enrichmentCandidate.create({ data: { jobId: job.id, supplierCatalogItemId: sampleItem.id, status: "NEW" } });
  return job;
}

async function researchCandidate(candidate: Awaited<ReturnType<typeof prisma.enrichmentCandidate.findMany>>[number]) {
  const item = await prisma.supplierCatalogItem.findUniqueOrThrow({ where: { id: candidate.supplierCatalogItemId } });
  const data = item.sourceArticle ? researched[item.sourceArticle] : undefined;
  if (!data) {
    await prisma.enrichmentCandidate.update({ where: { id: candidate.id }, data: { status: "UNRESOLVED", conflictReason: "No reliable public exact-article source found in pilot search." } });
    return "UNRESOLVED";
  }
  const brands = data.sources.map((s) => s.brand ?? data.brand);
  const conflict = data.conflict ?? detectConflict(brands);
  const sourceTypes = data.sources.map((s) => s.type);
  const confidence = calculateConfidence({ sourceTypes, exactArticle: true, brandConsistent: !conflict, marketplaceOnly: sourceTypes.every((s) => s === "MARKETPLACE"), conflict: Boolean(conflict) });
  const status = statusFor(confidence, conflict, sourceTypes);
  await prisma.enrichmentCandidate.update({ where: { id: candidate.id }, data: { proposedBrand: data.brand, proposedArticle: data.article, proposedName: data.name, proposedCategory: data.category ?? mapCategory(data.name), proposedOemNumbers: data.oem ?? [], proposedGtin: data.gtin, proposedUnit: item.sourceUnit, confidence: confidence.toFixed(2), status, conflictReason: conflict } });
  for (const source of data.sources) {
    await prisma.enrichmentEvidence.upsert({ where: { candidateId_sourceUrl_evidenceType: { candidateId: candidate.id, sourceUrl: source.url, evidenceType: source.evidence } }, update: { sourceType: source.type, sourceDomain: source.domain, sourceTitle: source.title, accessedAt: new Date(), extractedBrand: source.brand, extractedArticle: source.article, extractedName: source.name, extractedCategory: source.category, notes: source.notes, reliabilityScore: sourceReliability(source.type) }, create: { candidateId: candidate.id, sourceType: source.type, sourceUrl: source.url, sourceDomain: source.domain, sourceTitle: source.title, accessedAt: new Date(), evidenceType: source.evidence, extractedBrand: source.brand, extractedArticle: source.article, extractedName: source.name, extractedCategory: source.category, extractedOemNumbers: data.oem ?? [], extractedGtin: data.gtin, notes: source.notes, reliabilityScore: sourceReliability(source.type) } });
  }
  return status;
}

async function main() {
  const job = await ensureJob(get("--job"));
  const batchSize = Number(get("--batch-size") ?? 20);
  const candidates = await prisma.enrichmentCandidate.findMany({ where: { jobId: job.id, status: { in: ["NEW", "RESEARCHING"] } }, orderBy: { createdAt: "asc" }, take: batchSize });
  const started = Date.now();
  const statuses: Record<string, number> = {};
  for (const candidate of candidates) {
    const status = await researchCandidate(candidate);
    statuses[status] = (statuses[status] ?? 0) + 1;
  }
  const [confirmed, review, unresolved, rejected, researchedCount, evidenceCount] = await Promise.all([
    prisma.enrichmentCandidate.count({ where: { jobId: job.id, status: "CONFIRMED" } }),
    prisma.enrichmentCandidate.count({ where: { jobId: job.id, status: "NEEDS_REVIEW" } }),
    prisma.enrichmentCandidate.count({ where: { jobId: job.id, status: "UNRESOLVED" } }),
    prisma.enrichmentCandidate.count({ where: { jobId: job.id, status: "REJECTED" } }),
    prisma.enrichmentCandidate.count({ where: { jobId: job.id, status: { in: ["CONFIRMED", "NEEDS_REVIEW", "UNRESOLVED", "REJECTED"] } } }),
    prisma.enrichmentEvidence.count({ where: { candidate: { jobId: job.id } } }),
  ]);
  const stopGate = researchedCount >= 30 ? { checked: true, successRate: Math.round(((confirmed + review) / researchedCount) * 100), action: confirmed + review < researchedCount * 0.3 ? "STOP" : "CONTINUE" } : { checked: false };
  const report = { jobId: job.id, batchSize: candidates.length, researched: researchedCount, confirmed, needsReview: review, unresolved, rejected, avgSources: researchedCount ? Number((evidenceCount / researchedCount).toFixed(2)) : 0, avgMsPerItem: candidates.length ? Math.round((Date.now() - started) / candidates.length) : 0, stopGate };
  fs.mkdirSync("tmp", { recursive: true });
  const index = String(Math.ceil(researchedCount / Math.max(batchSize, 1))).padStart(2, "0");
  fs.writeFileSync(`tmp/enrichment-batch-${index}.json`, JSON.stringify(report, null, 2));
  await prisma.enrichmentJob.update({ where: { id: job.id }, data: { researchedItems: researchedCount, confirmedItems: confirmed, reviewItems: review, unresolvedItems: unresolved, status: stopGate.checked && stopGate.action === "STOP" ? "STOPPED" : "RESEARCHING", finishedAt: stopGate.checked && stopGate.action === "STOP" ? new Date() : null } });
  console.log(JSON.stringify(report, null, 2));
}

main().finally(async () => prisma.$disconnect());

