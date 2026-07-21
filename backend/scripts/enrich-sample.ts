import fs from "node:fs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const args = process.argv.slice(2);
function get(name: string) { const i = args.indexOf(name); return i === -1 ? undefined : args[i + 1]; }
const supplierCode = get("--supplier") ?? "ORION";
const limit = Number(get("--limit") ?? 100);
const seed = Number(get("--seed") ?? 20260721);

type Item = Awaited<ReturnType<typeof loadItems>>[number];

function mulberry32(a: number) {
  return function rand() {
    let t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}
function prefix(article: string | null) { return (article?.match(/^[A-Za-zА-Яа-я0-9]+/)?.[0] ?? "NO_ARTICLE").toUpperCase(); }
function firstWord(name: string | null) { return (name?.trim().split(/\s+/)[0] ?? "").toUpperCase(); }
function shuffle<T>(values: T[], rand: () => number) { return [...values].sort(() => rand() - 0.5); }
function add(bucket: Item[], selected: Map<string, Item>, count: number, rand: () => number) {
  for (const item of shuffle(bucket, rand)) {
    if (selected.size >= limit) return;
    if (selected.size >= count && count !== limit) return;
    selected.set(item.id, item);
  }
}

async function loadItems() {
  const supplier = await prisma.supplier.findUniqueOrThrow({ where: { code: supplierCode } });
  return prisma.supplierCatalogItem.findMany({ where: { supplierId: supplier.id, isActive: true }, orderBy: { sourceRowNumber: "asc" } });
}

async function main() {
  const rand = mulberry32(seed);
  const items = await loadItems();
  const selected = new Map<string, Item>();
  const byPrefix = new Map<string, Item[]>();
  const byArticle = new Map<string, Item[]>();
  for (const item of items) {
    const p = prefix(item.sourceArticle);
    byPrefix.set(p, [...(byPrefix.get(p) ?? []), item]);
    if (item.normalizedSourceArticle) byArticle.set(item.normalizedSourceArticle, [...(byArticle.get(item.normalizedSourceArticle) ?? []), item]);
  }
  const frequentPrefixes = [...byPrefix.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 20).flatMap(([, list]) => list.slice(0, 2));
  const rarePrefixes = [...byPrefix.values()].filter((list) => list.length === 1).flatMap((list) => list);
  const duplicateArticles = [...byArticle.values()].filter((list) => list.length > 1).flatMap((list) => list.slice(0, 2));
  const noArticle = items.filter((item) => !item.sourceArticle);
  const potentialBrand = items.filter((item) => item.sourceBrand || /\b(LOVOL|SHACMAN|FOTON|SHAANXI|SHANTUI|WEBASTO|ISUZU)\b/i.test(item.sourceName ?? ""));
  const shortNames = [...items].sort((a, b) => (a.sourceName?.length ?? 0) - (b.sourceName?.length ?? 0)).slice(0, 30);
  const longNames = [...items].sort((a, b) => (b.sourceName?.length ?? 0) - (a.sourceName?.length ?? 0)).slice(0, 30);
  const highPrice = [...items].sort((a, b) => Number(b.retailPrice ?? 0) - Number(a.retailPrice ?? 0)).slice(0, 30);
  const lowPrice = [...items].filter((item) => Number(item.retailPrice ?? 0) > 0).sort((a, b) => Number(a.retailPrice ?? 0) - Number(b.retailPrice ?? 0)).slice(0, 30);
  const firstWords = new Map<string, Item[]>();
  for (const item of items) firstWords.set(firstWord(item.sourceName), [...(firstWords.get(firstWord(item.sourceName)) ?? []), item]);
  const categoryLike = [...firstWords.values()].sort((a, b) => b.length - a.length).slice(0, 20).flatMap((list) => list.slice(0, 2));

  for (const bucket of [frequentPrefixes, rarePrefixes, duplicateArticles, noArticle, potentialBrand, shortNames, longNames, highPrice, lowPrice, categoryLike]) {
    add(bucket, selected, Math.min(limit, selected.size + 12), rand);
  }
  add(items, selected, limit, rand);
  const sample = [...selected.values()].slice(0, limit);
  fs.mkdirSync("tmp", { recursive: true });
  const json = sample.map((item) => ({ id: item.id, sourceRowNumber: item.sourceRowNumber, sourceArticle: item.sourceArticle, sourceName: item.sourceName, sourceBrand: item.sourceBrand, retailPrice: item.retailPrice?.toString(), stockQuantity: item.stockQuantity, matchingStatus: item.matchingStatus, prefix: prefix(item.sourceArticle), firstWord: firstWord(item.sourceName) }));
  fs.writeFileSync("tmp/orion-enrichment-sample.json", JSON.stringify({ supplier: supplierCode, limit, seed, generatedAt: new Date().toISOString(), items: json }, null, 2));
  const header = "itemId,sourceRowNumber,sourceArticle,sourceName,sourceBrand,price,stock,matchingStatus,prefix,firstWord";
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  fs.writeFileSync("tmp/orion-enrichment-sample.csv", [header, ...json.map((row) => [row.id, row.sourceRowNumber, row.sourceArticle, row.sourceName, row.sourceBrand, row.retailPrice, row.stockQuantity, row.matchingStatus, row.prefix, row.firstWord].map(esc).join(","))].join("\n"));
  const stats = { totalItems: items.length, sampleSize: sample.length, noArticle: sample.filter((i) => !i.sourceArticle).length, withPotentialBrand: sample.filter((i) => i.sourceBrand || /\b(LOVOL|SHACMAN|FOTON|SHAANXI|SHANTUI|WEBASTO|ISUZU)\b/i.test(i.sourceName ?? "")).length, duplicateArticleRows: sample.filter((i) => i.normalizedSourceArticle && (byArticle.get(i.normalizedSourceArticle)?.length ?? 0) > 1).length, highPriceMax: Math.max(...sample.map((i) => Number(i.retailPrice ?? 0))), lowPriceMin: Math.min(...sample.map((i) => Number(i.retailPrice ?? 0)).filter(Boolean)), topPrefixes: [...new Set(sample.map((i) => prefix(i.sourceArticle)))].slice(0, 20), topFirstWords: [...new Set(sample.map((i) => firstWord(i.sourceName)))].slice(0, 20) };
  console.log(JSON.stringify(stats, null, 2));
}

main().finally(async () => prisma.$disconnect());