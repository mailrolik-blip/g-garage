import crypto from "node:crypto";
import { normalizeArticle, normalizeName } from "../../lib/normalize.js";

export function hashText(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex").slice(0, 24);
}

export function buildSourceKey(input: {
  supplierId: string;
  warehouseId?: string | null;
  sourceArticle?: string | null;
  sourceName?: string | null;
  rowContext?: string | null;
}): string {
  const supplier = input.supplierId;
  const warehouse = input.warehouseId ?? "NO_WAREHOUSE";
  const normalizedArticle = normalizeArticle(input.sourceArticle).normalizedArticle;
  if (normalizedArticle) return `${supplier}:${warehouse}:ARTICLE:${normalizedArticle}`;
  const normalizedName = normalizeName(input.sourceName).toUpperCase();
  return `${supplier}:${warehouse}:NAME:${hashText(`${normalizedName}:${input.rowContext ?? ""}`)}`;
}