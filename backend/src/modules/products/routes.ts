import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { normalizeArticle } from "../../lib/normalize.js";
import { idParamSchema, productListQuerySchema, slugParamSchema } from "../../lib/validation.js";
import { ApiError } from "../../plugins/error-handler.js";

function productInclude() {
  return { brand: true, category: true, images: { orderBy: { sortOrder: "asc" as const } }, offers: { where: { isActive: true }, include: { supplier: true, warehouse: true }, orderBy: [{ retailPrice: "asc" as const }, { deliveryDaysMin: "asc" as const }] } };
}

function decorate(product: any) {
  const offers = product.offers ?? [];
  const prices = offers.map((offer: any) => Number(offer.retailPrice));
  const delivery = offers.map((offer: any) => offer.deliveryDaysMin).filter((v: unknown) => typeof v === "number");
  return { ...product, minPrice: prices.length ? Math.min(...prices) : null, maxPrice: prices.length ? Math.max(...prices) : null, totalStock: offers.reduce((sum: number, offer: any) => sum + offer.stockQuantity, 0), bestDeliveryDays: delivery.length ? Math.min(...delivery) : null };
}

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/products", async (request) => {
    const query = productListQuerySchema.parse(request.query);
    const where: Prisma.ProductWhereInput = { isActive: true };
    const and: Prisma.ProductWhereInput[] = [];
    if (query.article) and.push({ normalizedArticle: { contains: normalizeArticle(query.article).normalizedArticle, mode: "insensitive" } });
    if (query.brand) and.push({ brand: { OR: [{ slug: query.brand }, { normalizedName: query.brand.toUpperCase() }, { name: { contains: query.brand, mode: "insensitive" } }] } });
    if (query.category) and.push({ category: { OR: [{ slug: query.category }, { name: { contains: query.category, mode: "insensitive" } }] } });
    if (query.qualityLevel) and.push({ qualityLevel: query.qualityLevel });
    if (query.inStock === "true") and.push({ offers: { some: { isActive: true, stockQuantity: { gt: 0 } } } });
    if (query.minPrice !== undefined || query.maxPrice !== undefined) and.push({ offers: { some: { isActive: true, retailPrice: { gte: query.minPrice, lte: query.maxPrice } } } });
    if (query.search) {
      const norm = normalizeArticle(query.search).normalizedArticle;
      const parts = query.search.trim().split(/\s+/);
      and.push({ OR: [
        { normalizedArticle: norm },
        { normalizedArticle: { startsWith: norm, mode: "insensitive" } },
        { article: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { brand: { name: { contains: parts[0], mode: "insensitive" } } },
        parts.length > 1 ? { AND: [{ brand: { name: { contains: parts[0], mode: "insensitive" } } }, { OR: [{ article: { contains: parts.slice(1).join(" "), mode: "insensitive" } }, { name: { contains: parts.slice(1).join(" "), mode: "insensitive" } }] }] } : {},
      ] });
    }
    if (and.length) where.AND = and;
    const orderBy: Prisma.ProductOrderByWithRelationInput[] = query.sort === "name_asc" ? [{ name: "asc" }] : query.sort === "newest" ? [{ createdAt: "desc" }] : [{ createdAt: "desc" }];
    const total = await app.prisma.product.count({ where });
    let products = await app.prisma.product.findMany({ where, include: productInclude(), orderBy, skip: (query.page - 1) * query.limit, take: query.limit });
    if (query.sort === "price_asc" || query.sort === "price_desc" || query.sort === "delivery_fast") {
      products = products.sort((a, b) => {
        const da = decorate(a), db = decorate(b);
        if (query.sort === "delivery_fast") return (da.bestDeliveryDays ?? 999) - (db.bestDeliveryDays ?? 999);
        return query.sort === "price_asc" ? (da.minPrice ?? 999999999) - (db.minPrice ?? 999999999) : (db.maxPrice ?? 0) - (da.maxPrice ?? 0);
      });
    }
    return { data: products.map(decorate), pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) }, filters: { search: query.search ?? null, brand: query.brand ?? null, category: query.category ?? null, inStock: query.inStock ?? null, qualityLevel: query.qualityLevel ?? null, sort: query.sort } };
  });
  app.get("/api/v1/products/:id", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const product = await app.prisma.product.findUnique({ where: { id }, include: productInclude() });
    if (!product || !product.isActive) throw new ApiError("PRODUCT_NOT_FOUND", "Product not found", 404);
    return decorate(product);
  });
  app.get("/api/v1/products/by-slug/:slug", async (request) => {
    const { slug } = slugParamSchema.parse(request.params);
    const product = await app.prisma.product.findUnique({ where: { slug }, include: productInclude() });
    if (!product || !product.isActive) throw new ApiError("PRODUCT_NOT_FOUND", "Product not found", 404);
    return decorate(product);
  });
};
