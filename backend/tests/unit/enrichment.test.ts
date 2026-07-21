import { describe, expect, it } from "vitest";
import { calculateConfidence, detectConflict, mapCategory, sourceReliability, validateGtin } from "../../src/modules/enrichment/confidence.js";

function dedupeEvidence(urls: string[]) {
  return [...new Set(urls.map((url) => url.trim().toLowerCase()))];
}

describe("enrichment confidence helpers", () => {
  it("validates GTIN check digits", () => { expect(validateGtin("4601234567893")).toBe(true); });
  it("rejects invalid GTIN check digits", () => { expect(validateGtin("4601234567890")).toBe(false); });
  it("scores source reliability by source type", () => { expect(sourceReliability("MANUFACTURER")).toBeGreaterThan(sourceReliability("MARKETPLACE")); });
  it("calculates high confidence for two reliable exact-article sources", () => { expect(calculateConfidence({ sourceTypes: ["PARTS_CATALOG", "LARGE_RETAILER"], exactArticle: true, brandConsistent: true, marketplaceOnly: false, conflict: false })).toBe(92); });
  it("keeps a single strong source below auto-accept threshold", () => { expect(calculateConfidence({ sourceTypes: ["PARTS_CATALOG"], exactArticle: true, brandConsistent: true, marketplaceOnly: false, conflict: false })).toBeLessThan(90); });
  it("detects brand conflicts", () => { expect(detectConflict(["SHACMAN", "Weichai"])).toContain("SHACMAN"); });
  it("blocks marketplace-only confidence", () => { expect(calculateConfidence({ sourceTypes: ["MARKETPLACE", "MARKETPLACE"], exactArticle: true, brandConsistent: true, marketplaceOnly: true, conflict: false })).toBeLessThan(75); });
  it("maps known category terms", () => { expect(mapCategory("Expansion tank assembly")).toBe("охлаждение"); });
  it("normalizes candidate evidence duplicates by URL", () => { expect(dedupeEvidence([" HTTPS://EXAMPLE.INVALID/P ", "https://example.invalid/p"])).toHaveLength(1); });
});
