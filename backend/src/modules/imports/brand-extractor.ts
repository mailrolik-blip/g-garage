import fs from "node:fs";
import { normalizeBrand, normalizeName } from "../../lib/normalize.js";

export type BrandAliases = Record<string, string[]>;
export type BrandExtraction =
  | { status: "none"; brand: null; aliases: string[] }
  | { status: "single"; brand: string; aliases: string[] }
  | { status: "multiple"; brand: null; aliases: string[] };

export function loadBrandAliases(file = "imports/mappings/brand-aliases.json"): BrandAliases {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file, "utf8")) as BrandAliases;
}

function aliasPattern(alias: string): RegExp {
  const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/[\s-]+/g, "[\\s-]+");
  return new RegExp(`(^|[\\s(/,;:])${escaped}($|[\\s)/,;:])`, "iu");
}

export function extractBrandFromName(name: unknown, aliases: BrandAliases): BrandExtraction {
  const text = normalizeName(name);
  if (!text) return { status: "none", brand: null, aliases: [] };
  const matches: string[] = [];
  for (const [brand, values] of Object.entries(aliases)) {
    for (const alias of values) {
      if (aliasPattern(alias).test(text)) {
        matches.push(normalizeBrand(brand).normalizedName);
        break;
      }
    }
  }
  const unique = [...new Set(matches)];
  if (unique.length === 0) return { status: "none", brand: null, aliases: [] };
  if (unique.length > 1) return { status: "multiple", brand: null, aliases: unique };
  return { status: "single", brand: unique[0], aliases: unique };
}