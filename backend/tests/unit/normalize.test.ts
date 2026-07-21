import { describe, expect, it } from "vitest";
import { chooseBestName, normalizeArticle, normalizeBrand, parsePrice, parseStock, productIdentity } from "../../src/lib/normalize.js";

describe("normalization", () => {
  it("normalizes article while preserving display article", () => { expect(normalizeArticle(" ab-12 3 ")).toEqual({ article: "AB-12 3", normalizedArticle: "AB123" }); });
  it("normalizes brand names", () => { expect(normalizeBrand(" brembo ")).toEqual({ name: "Brembo", normalizedName: "BREMBO" }); });
  it("parses prices without float output", () => { expect(parsePrice("3,690,000.00")).toEqual({ ok: true, value: "3690000.00" }); expect(parsePrice("12,50")).toEqual({ ok: true, value: "12.50" }); });
  it("rejects invalid prices", () => { expect(parsePrice(0)).toEqual({ ok: false, error: "PRICE_ZERO" }); expect(parsePrice(-1)).toEqual({ ok: false, error: "PRICE_NEGATIVE" }); });
  it("parses stock strictly", () => { expect(parseStock("12")).toEqual({ ok: true, value: 12 }); expect(parseStock("под заказ")).toEqual({ ok: false, error: "STOCK_TEXT" }); });
  it("uses brand and normalized article as product identity", () => { expect(productIdentity("Brembo", "BR-100")).toBe("BREMBO:BR100"); });
  it("chooses the most complete duplicate product name", () => { expect(chooseBestName(["Brake disc", "Brake disc front ventilated"])).toEqual({ name: "Brake disc front ventilated", conflict: true }); });
});
