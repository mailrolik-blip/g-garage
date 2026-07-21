import fs from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function csv(value: unknown) { return `"${String(value ?? "").replace(/"/g, '""')}"`; }

async function main() {
  const jobId = get("--job");
  const format = get("--format") ?? "csv";
  if (!jobId || format !== "csv") throw new Error("Usage: npm run enrich:export -- --job JOB --format csv");
  const output = get("--output") ?? "tmp/orion-enrichment-review.csv";
  const candidates = await prisma.enrichmentCandidate.findMany({
    where: { jobId },
    orderBy: { createdAt: "asc" },
    include: { supplierCatalogItem: true, evidence: { orderBy: { reliabilityScore: "desc" }, take: 3 }, decisions: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
  const header = ["itemId", "sourceArticle", "sourceName", "sourcePrice", "proposedBrand", "proposedArticle", "proposedName", "proposedCategory", "proposedOem", "proposedGtin", "confidence", "status", "source1", "source2", "source3", "conflicts", "decision", "note"];
  const lines = candidates.map((candidate) => [
    candidate.supplierCatalogItemId,
    candidate.supplierCatalogItem.sourceArticle,
    candidate.supplierCatalogItem.sourceName,
    candidate.supplierCatalogItem.retailPrice,
    candidate.proposedBrand,
    candidate.proposedArticle,
    candidate.proposedName,
    candidate.proposedCategory,
    Array.isArray(candidate.proposedOemNumbers) ? candidate.proposedOemNumbers.join("; ") : "",
    candidate.proposedGtin,
    candidate.confidence,
    candidate.status,
    candidate.evidence[0]?.sourceUrl,
    candidate.evidence[1]?.sourceUrl,
    candidate.evidence[2]?.sourceUrl,
    candidate.conflictReason,
    candidate.decisions[0]?.decision,
    candidate.decisions[0]?.note,
  ].map(csv).join(","));
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, [header.join(","), ...lines].join("\n"));
  console.log(JSON.stringify({ exported: output, rows: candidates.length }, null, 2));
}

main().finally(async () => prisma.$disconnect());
