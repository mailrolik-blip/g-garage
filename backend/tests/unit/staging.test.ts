import { describe, expect, it } from "vitest";
import { normalizeArticle } from "../../src/lib/normalize.js";
import { extractBrandFromName } from "../../src/modules/imports/brand-extractor.js";
import { buildSourceKey } from "../../src/modules/imports/source-key.js";
import { prepareStagingRow } from "../../src/modules/imports/staging.js";

const aliases = { BOSCH: ["BOSCH", "БОШ"], BREMBO: ["BREMBO"] };
const mapping = {
  supplier: { name: "Fixture", code: "FIXTURE" },
  warehouse: { name: "Fixture", code: "FIX", city: null },
  sheetName: null,
  headerRow: 1,
  columns: { brand: "Brand", article: "Article", name: "Name", stock: "Stock", unit: "Unit", purchasePrice: "PurchasePrice", retailPrice: "RetailPrice", category: null, currency: null, minimumOrderQuantity: null },
  defaults: { currency: "RUB", unit: "pcs", minimumOrderQuantity: 1 },
  deliveryRules: { defaultDaysMin: 1, defaultDaysMax: 3 },
  skipRows: [],
};

describe("supplier staging helpers", () => {
  it("builds sourceKey from article before row number", () => {
    expect(buildSourceKey({ supplierId: "s1", warehouseId: "w1", sourceArticle: "AB- 100", sourceName: "Name", rowContext: "10" })).toBe("s1:w1:ARTICLE:AB100");
  });

  it("builds stable hashed sourceKey from name when article is missing", () => {
    expect(buildSourceKey({ supplierId: "s1", warehouseId: "w1", sourceName: "Brake Pad", rowContext: "10" })).toBe(buildSourceKey({ supplierId: "s1", warehouseId: "w1", sourceName: "Brake Pad", rowContext: "10" }));
  });

  it("extracts exact brand aliases", () => {
    expect(extractBrandFromName("BOSCH oxygen sensor", aliases)).toEqual({ status: "single", brand: "BOSCH", aliases: ["BOSCH"] });
  });

  it("marks multiple aliases as ambiguous", () => {
    expect(extractBrandFromName("BOSCH BREMBO kit", aliases).status).toBe("multiple");
  });

  it("keeps no-brand rows valid for staging", () => {
    const row = prepareStagingRow({ row: { rowNumber: 2, rawData: { Article: "NB-100", Name: "Generic oil filter", Stock: "3", Unit: "pcs", PurchasePrice: "300", RetailPrice: "450" } }, mapping, supplierId: "s1", warehouseId: "w1", aliases });
    expect(row.matchingStatus).toBe("UNMATCHED");
    expect(row.sourceBrand).toBeNull();
    expect(row.issues.some((issue) => issue.code === "BRAND_MISSING")).toBe(true);
  });

  it("rejects rows without article and name", () => {
    const row = prepareStagingRow({ row: { rowNumber: 3, rawData: { Article: "", Name: "", Stock: "3", Unit: "pcs", PurchasePrice: "300", RetailPrice: "450" } }, mapping, supplierId: "s1", warehouseId: "w1", aliases });
    expect(row.matchingStatus).toBe("REJECTED");
  });

  it("normalizes source article without mutating source article", () => {
    const value = normalizeArticle(" ab- 10 ");
    expect(value.article).toBe("AB- 10");
    expect(value.normalizedArticle).toBe("AB10");
  });
});