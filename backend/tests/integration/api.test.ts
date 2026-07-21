import { beforeAll, afterAll, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { FastifyInstance } from "fastify";

let app: FastifyInstance;
let productId = "";
let productSlug = "";

beforeAll(async () => { app = await buildApp(); await app.ready(); const res = await app.inject({ method: "GET", url: "/api/v1/products?page=1&limit=1" }); const body = JSON.parse(res.body); productId = body.data[0]?.id; productSlug = body.data[0]?.slug; });
afterAll(async () => { await app.close(); });

describe("catalog API", () => {
  it("returns health", async () => { const res = await app.inject({ method: "GET", url: "/health" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body)).toEqual({ status: "ok", service: "ggarage-catalog-api" }); });
  it("returns categories", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/categories" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).length).toBeGreaterThanOrEqual(8); });
  it("returns brands", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/brands" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).length).toBeGreaterThanOrEqual(8); });
  it("returns products with pagination", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products?page=1&limit=5" }); const body = JSON.parse(res.body); expect(res.statusCode).toBe(200); expect(body.data.length).toBeLessThanOrEqual(5); expect(body.pagination.total).toBeGreaterThanOrEqual(24); });
  it("filters products by stock", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products?inStock=true&limit=10" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).data.every((p: any) => p.totalStock > 0)).toBe(true); });
  it("searches by brand or name", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products?search=brembo" }); expect(res.statusCode).toBe(200); expect(JSON.parse(res.body).data.length).toBeGreaterThan(0); });
  it("sorts by price", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products?inStock=true&sort=price_asc&limit=10" }); const prices = JSON.parse(res.body).data.map((p: any) => p.minPrice); expect(prices[0]).toBeLessThanOrEqual(prices.at(-1)); });
  it("returns product by id and slug", async () => { const byId = await app.inject({ method: "GET", url: `/api/v1/products/${productId}` }); const bySlug = await app.inject({ method: "GET", url: `/api/v1/products/by-slug/${productSlug}` }); expect(byId.statusCode).toBe(200); expect(bySlug.statusCode).toBe(200); });
  it("returns 400 for invalid query", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products?limit=101" }); expect(res.statusCode).toBe(400); expect(JSON.parse(res.body).error.code).toBe("VALIDATION_ERROR"); });
  it("returns 404 for missing product", async () => { const res = await app.inject({ method: "GET", url: "/api/v1/products/missing-product" }); expect(res.statusCode).toBe(404); expect(JSON.parse(res.body).error.code).toBe("PRODUCT_NOT_FOUND"); });
});
