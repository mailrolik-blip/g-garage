import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import XLSX from "xlsx";

export type SheetAnalysis = {
  name: string;
  rowCount: number;
  dataRowCount: number;
  headerRow: number | null;
  columns: string[];
  emptyColumns: string[];
  examples: Record<string, unknown>[];
  duplicateArticles: number;
  typeSummary: Record<string, Record<string, number>>;
  detected: Record<string, boolean>;
};

export function sha256(file: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex");
}

function cellText(value: unknown): string { return String(value ?? "").trim(); }
function valueType(value: string): string {
  if (!value) return "empty";
  if (/^[-+]?\d+$/.test(value)) return "integer";
  if (/^[-+]?\d{1,3}(,\d{3})*(\.\d{1,2})?$/.test(value) || /^[-+]?\d+([,.]\d{1,2})?$/.test(value)) return "decimal";
  if (/\d{1,2}\.\d{1,2}\.\d{2,4}/.test(value)) return "date-like";
  return "text";
}
function has(columns: string[], variants: string[]) { return columns.some((c) => variants.some((v) => c.toLowerCase().includes(v))); }

export function inspectWorkbook(file: string): { filename: string; size: number; hash: string; format: string; sheets: SheetAnalysis[] } {
  const workbook = XLSX.readFile(file, { cellDates: true });
  const sheets = workbook.SheetNames.map((name) => {
    const sheet = workbook.Sheets[name];
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: "" });
    let headerRow: number | null = null;
    let columns: string[] = [];
    for (let i = 0; i < Math.min(rows.length, 50); i++) {
      const values = (rows[i] ?? []).map(cellText);
      const nonEmpty = values.filter(Boolean);
      if (nonEmpty.length >= 3) { headerRow = i + 1; columns = values.map((v, idx) => v || `__EMPTY_${idx + 1}`); break; }
    }
    const dataRows = headerRow ? rows.slice(headerRow).filter((row) => (row as unknown[]).some((v) => cellText(v))) : [];
    const emptyColumns = columns.filter((_, idx) => dataRows.every((row) => !cellText((row as unknown[])[idx])));
    const examples = dataRows.slice(0, 20).map((row) => Object.fromEntries(columns.map((col, idx) => [col, cellText((row as unknown[])[idx])]))) as Record<string, unknown>[];
    const articleIndex = columns.findIndex((c) => c.toLowerCase().includes("артикул") || c.toLowerCase().includes("article"));
    const seen = new Set<string>(); let duplicateArticles = 0;
    if (articleIndex >= 0) for (const row of dataRows) { const value = cellText((row as unknown[])[articleIndex]).toUpperCase().replace(/[\s-]+/g, ""); if (!value) continue; if (seen.has(value)) duplicateArticles++; else seen.add(value); }
    const typeSummary: Record<string, Record<string, number>> = {};
    columns.forEach((col, idx) => { typeSummary[col] = {}; for (const row of dataRows.slice(0, 500)) { const t = valueType(cellText((row as unknown[])[idx])); typeSummary[col][t] = (typeSummary[col][t] ?? 0) + 1; } });
    const lc = columns.map((c) => c.toLowerCase());
    const detected = {
      article: has(lc, ["артикул", "article"]), brand: has(lc, ["бренд", "brand"]), manufacturer: has(lc, ["производ", "manufacturer"]), name: has(lc, ["наименование", "name", "название"]), stock: has(lc, ["свобод", "остат", "stock"]), warehouse: has(lc, ["склад", "warehouse"]), delivery: has(lc, ["срок", "delivery"]), category: has(lc, ["катег", "category"]), unit: has(lc, ["ед.изм", "ед", "unit"]), minOrder: has(lc, ["мин", "парт"]), multiplePrices: lc.filter((c) => c.includes("цен") || c.includes("price")).length > 1, currency: has(lc, ["валют", "currency"]), price: has(lc, ["цена", "price"]),
    };
    return { name, rowCount: rows.length, dataRowCount: dataRows.length, headerRow, columns, emptyColumns, examples, duplicateArticles, typeSummary, detected };
  });
  return { filename: path.basename(file), size: fs.statSync(file).size, hash: sha256(file), format: path.extname(file).toLowerCase().replace(".", ""), sheets };
}

function usage(): never { console.error("Usage: npm run price:inspect -- --file <path>"); process.exit(2); }

if (process.argv[1]?.endsWith("inspect-orion-price.ts")) {
  const fileArg = process.argv[process.argv.indexOf("--file") + 1];
  if (!fileArg || process.argv.indexOf("--file") === -1) usage();
  console.log(JSON.stringify(inspectWorkbook(fileArg), null, 2));
}
