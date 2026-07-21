import fs from "node:fs";
import { PrismaClient, type EnrichmentDecisionValue, type EnrichmentCandidateStatus } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function has(name: string) { return args.includes(name); }

const editable: Partial<Record<"brand" | "article" | "name" | "category", string>> = {
  brand: get("--brand"),
  article: get("--article"),
  name: get("--name"),
  category: get("--category"),
};

async function showCandidate(id: string) {
  const candidate = await prisma.enrichmentCandidate.findUnique({
    where: { id },
    include: { supplierCatalogItem: true, evidence: { orderBy: { reliabilityScore: "desc" } }, decisions: { orderBy: { createdAt: "desc" } } },
  });
  console.log(JSON.stringify(candidate, null, 2));
}

async function listCandidates() {
  const jobId = get("--job");
  const status = get("--status") as EnrichmentCandidateStatus | undefined;
  const candidates = await prisma.enrichmentCandidate.findMany({
    where: { jobId, status },
    orderBy: [{ status: "asc" }, { createdAt: "asc" }],
    take: Number(get("--limit") ?? 50),
    include: { supplierCatalogItem: { select: { sourceArticle: true, sourceName: true, retailPrice: true, matchingStatus: true } }, _count: { select: { evidence: true } } },
  });
  console.log(JSON.stringify(candidates.map((candidate) => ({
    id: candidate.id,
    itemId: candidate.supplierCatalogItemId,
    sourceArticle: candidate.supplierCatalogItem.sourceArticle,
    sourceName: candidate.supplierCatalogItem.sourceName,
    proposedBrand: candidate.proposedBrand,
    proposedArticle: candidate.proposedArticle,
    proposedName: candidate.proposedName,
    proposedCategory: candidate.proposedCategory,
    confidence: candidate.confidence,
    status: candidate.status,
    evidenceCount: candidate._count.evidence,
    conflict: candidate.conflictReason,
  })), null, 2));
}

async function decide(decision: EnrichmentDecisionValue) {
  const candidateId = get("--candidate");
  if (!candidateId) throw new Error("--candidate is required");
  const note = get("--note") ?? get("--reason") ?? null;
  const productId = get("--product") ?? null;
  const updateData = Object.fromEntries(Object.entries({
    proposedBrand: editable.brand,
    proposedArticle: editable.article,
    proposedName: editable.name,
    proposedCategory: editable.category,
  }).filter((entry): entry is [string, string] => Boolean(entry[1])));
  const statusByDecision: Record<EnrichmentDecisionValue, EnrichmentCandidateStatus> = {
    ACCEPT: "CONFIRMED",
    REVIEW: "NEEDS_REVIEW",
    REJECT: "REJECTED",
    UNRESOLVED: "UNRESOLVED",
  };
  const candidate = await prisma.enrichmentCandidate.update({
    where: { id: candidateId },
    data: { ...updateData, status: statusByDecision[decision] },
  });
  await prisma.enrichmentDecision.create({ data: { candidateId: candidate.id, decision, decidedBy: "enrich:review", note, productId } });
  console.log(JSON.stringify({ candidateId: candidate.id, decision, status: statusByDecision[decision] }, null, 2));
}

async function main() {
  if (has("--list")) return listCandidates();
  const candidateId = get("--candidate");
  if (candidateId && !has("--accept") && !has("--review") && !has("--reject") && !has("--unresolved")) return showCandidate(candidateId);
  if (has("--accept")) return decide("ACCEPT");
  if (has("--review")) return decide("REVIEW");
  if (has("--reject")) return decide("REJECT");
  if (has("--unresolved")) return decide("UNRESOLVED");
  console.error("Usage: npm run enrich:review -- --list --job JOB [--status STATUS] | --candidate ID | --candidate ID --accept|--review|--reject|--unresolved [--brand B --article A --name N --category C --note TEXT]");
  process.exit(2);
}

main().finally(async () => prisma.$disconnect());
