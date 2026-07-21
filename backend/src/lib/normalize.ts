import fs from "node:fs";
import crypto from "node:crypto";

export type NormalizedArticle = { article: string; normalizedArticle: string };
export type NormalizedBrand = { name: string; normalizedName: string };

export function normalizeArticle(value: unknown): NormalizedArticle {
  const article = String(value ?? "").trim().toUpperCase().replace(/\s+/g, " ");
  return { article, normalizedArticle: article.replace(/[\s-]+/g, "") };
}

export function normalizeBrand(value: unknown): NormalizedBrand {
  const raw = String(value ?? "").trim().replace(/\s+/g, " ");
  const name = raw.length <= 4 ? raw.toUpperCase() : raw.replace(/\p{L}+/gu, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
  return { name, normalizedName: name.toUpperCase() };
}

export function normalizeName(value: unknown): string {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function normalizePriceText(value: unknown): string {
  let text = String(value ?? "").trim().replace(/\s+/g, "");
  if (text.includes(",") && text.includes(".")) text = text.replace(/,/g, "");
  else if (text.includes(",")) text = text.replace(",", ".");
  return text;
}

export function parsePrice(value: unknown): { ok: true; value: string } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") return { ok: false, error: "PRICE_REQUIRED" };
  const normalized = normalizePriceText(value);
  if (!/^[-+]?\d+(\.\d{1,2})?$/.test(normalized)) return { ok: false, error: "PRICE_INVALID" };
  const numeric = Number(normalized);
  if (numeric < 0) return { ok: false, error: "PRICE_NEGATIVE" };
  if (numeric === 0) return { ok: false, error: "PRICE_ZERO" };
  return { ok: true, value: numeric.toFixed(2) };
}

export function parseStock(value: unknown): { ok: true; value: number } | { ok: false; error: string } {
  if (value === null || value === undefined || value === "") return { ok: false, error: "STOCK_REQUIRED" };
  if (typeof value === "string" && !/^[-+]?\d+$/.test(value.trim())) return { ok: false, error: "STOCK_TEXT" };
  const numeric = Number(value);
  if (!Number.isInteger(numeric)) return { ok: false, error: "STOCK_INVALID" };
  if (numeric < 0) return { ok: false, error: "STOCK_NEGATIVE" };
  return { ok: true, value: numeric };
}

export function productIdentity(brand: string, article: string): string {
  return `${normalizeBrand(brand).normalizedName}:${normalizeArticle(article).normalizedArticle}`;
}

export function chooseBestName(names: string[]): { name: string; conflict: boolean } {
  const cleaned = [...new Set(names.map(normalizeName).filter(Boolean))];
  cleaned.sort((a, b) => b.length - a.length);
  return { name: cleaned[0] ?? "", conflict: cleaned.length > 1 };
}

export function sha256File(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

export function slugify(value: string): string {
  return normalizeName(value).toLowerCase().replace(/[^a-zа-яё0-9]+/giu, "-").replace(/^-+|-+$/g, "").slice(0, 90) || "item";
}
