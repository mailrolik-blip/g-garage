import { execFileSync } from "node:child_process";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
import { beforeAll, afterAll, describe, expect, it } from "vitest";

const prisma = new PrismaClient();
const fixture = path.resolve("imports/fixtures/orion-fixture.csv");
const mapping = path.resolve("imports/fixtures/orion-fixture.mapping.json");

function runImport(args: string[]) {
  const tsx = path.resolve("node_modules/tsx/dist/cli.mjs");
  return execFileSync(process.execPath, [tsx, "scripts/import-orion-price.ts", "--file", fixture, "--mapping", mapping, ...args], {
    cwd: process.cwd(),
    encoding: "utf8",
  });
}

beforeAll(async () => {
  await prisma.priceImportRow.deleteMany({ where: { import: { supplier: { code: "FIXTURE" } } } });
  await prisma.priceImport.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.supplierOffer.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.warehouse.deleteMany({ where: { supplier: { code: "FIXTURE" } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "BREMBO-" } } });
  await prisma.product.deleteMany({ where: { sku: { startsWith: "MANN-" } } });
  await prisma.supplier.deleteMany({ where: { code: "FIXTURE" } });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Orion importer", () => {
  it("dry-run does not change database", async () => {
    const before = await prisma.supplierOffer.count({ where: { supplier: { code: "FIXTURE" } } });
    const output = runImport(["--dry-run"]);
    const after = await prisma.supplierOffer.count({ where: { supplier: { code: "FIXTURE" } } });
    expect(output).toContain('"validRows": 3');
    expect(output).toContain('"invalidRows": 2');
    expect(after).toBe(before);
  });

  it("first import creates products and offers and records bad rows", async () => {
    const output = runImport([]);
    expect(output).toContain('"createdOffers": 2');
    expect(await prisma.supplierOffer.count({ where: { supplier: { code: "FIXTURE" } } })).toBe(2);
    expect(await prisma.priceImportRow.count({ where: { import: { supplier: { code: "FIXTURE" } }, status: "invalid" } })).toBe(2);
  });

  it("second import returns ALREADY_IMPORTED", () => {
    expect(runImport([])).toContain("ALREADY_IMPORTED");
  });

  it("force import is idempotent and updates duplicate offer price", async () => {
    const output = runImport(["--force"]);
    expect(output).toContain('"updatedOffers": 3');
    const offer = await prisma.supplierOffer.findFirstOrThrow({ where: { supplier: { code: "FIXTURE" }, supplierArticle: "BR-100" } });
    expect(Number(offer.retailPrice)).toBe(1400);
  });

  it("missing offers stay active without deactivate flag", async () => {
    const active = await prisma.supplierOffer.count({ where: { supplier: { code: "FIXTURE" }, isActive: true } });
    expect(active).toBe(2);
  });
});