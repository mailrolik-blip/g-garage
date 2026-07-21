import type { Prisma } from "@prisma/client";
import type { FastifyPluginAsync } from "fastify";
import { normalizeArticle } from "../../lib/normalize.js";
import { idParamSchema, productListQuerySchema, slugParamSchema } from "../../lib/validation.js";
import { ApiError } from "../../plugins/error-handler.js";

function productInclude() {
  return {
    brand: true,
    category: true,
    images: { orderBy: { sortOrder: "asc" as const } },
    offers: {
      where: { isActive: true },
      select: {
        id: true,
        productId: true,
        warehouseId: true,
        supplierArticle: true,
        retailPrice: true,
        currency: true,
        stockQuantity: true,
        minimumOrderQuantity: true,
        deliveryDaysMin: true,
        deliveryDaysMax: true,
        availableAt: true,
        sourceUpdatedAt: true,
        matchedAt: true,
        updatedAt: true,
        warehouse: { select: { city: true } },
      },
      orderBy: [{ retailPrice: "asc" as const }, { deliveryDaysMin: "asc" as const }],
    },
    enrichmentDecisions: {
      where: { decision: "ACCEPT" as const },
      orderBy: { createdAt: "desc" as const },
      take: 1,
      include: { candidate: { include: { _count: { select: { evidence: true } } } } },
    },
  };
}

type ProductWithOffers = Prisma.ProductGetPayload<{ include: ReturnType<typeof productInclude> }>;

function decorate(product: ProductWithOffers) {
  const offers = product.offers ?? [];
  const { enrichmentDecisions, ...publicProduct } = product;
  const acceptedEnrichment = enrichmentDecisions[0] ?? null;
  const prices = offers.map((offer) => Number(offer.retailPrice));
  const delivery = offers.map((offer) => offer.deliveryDaysMin).filter((value): value is number => typeof value === "number");
  const supplierCount = new Set(offers.map((offer) => offer.warehouseId ?? offer.id)).size;
  const updatedAtValues = offers.flatMap((offer) => [offer.sourceUpdatedAt, offer.updatedAt]).filter((value): value is Date => value instanceof Date);
  const latestUpdate = updatedAtValues.length ? new Date(Math.max(...updatedAtValues.map((value) => value.getTime()))) : null;
  return {
    ...publicProduct,
    minPrice: prices.length ? Math.min(...prices) : null,
    maxPrice: prices.length ? Math.max(...prices) : null,
    totalStock: offers.reduce((sum, offer) => sum + offer.stockQuantity, 0),
    bestDeliveryDays: delivery.length ? Math.min(...delivery) : null,
    offerCount: offers.length,
    supplierCount,
    priceUpdatedAt: latestUpdate,
    availabilityUpdatedAt: latestUpdate,
    enrichmentStatus: acceptedEnrichment ? "CONFIRMED" : null,
    evidenceCount: acceptedEnrichment?.candidate._count.evidence ?? 0,
    confirmedAt: acceptedEnrichment?.createdAt ?? null,
  };
}

export const productRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/products", async (request) => {
    const query = productListQuerySchema.parse(request.query);
    const where: Prisma.ProductWhereInput = { isActive: true, offers: { some: { isActive: true } } };
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
      const searchOr: Prisma.ProductWhereInput[] = [
        { normalizedArticle: norm },
        { normalizedArticle: { startsWith: norm, mode: "insensitive" } },
        { article: { contains: query.search, mode: "insensitive" } },
        { name: { contains: query.search, mode: "insensitive" } },
        { brand: { name: { contains: parts[0], mode: "insensitive" } } },
      ];
      if (parts.length > 1) {
        searchOr.push({ AND: [{ brand: { name: { contains: parts[0], mode: "insensitive" } } }, { OR: [{ article: { contains: parts.slice(1).join(" "), mode: "insensitive" } }, { name: { contains: parts.slice(1).join(" "), mode: "insensitive" } }] }] });
      }
      and.push({ OR: searchOr });
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
    const product = await app.prisma.product.findFirst({ where: { id, isActive: true, offers: { some: { isActive: true } } }, include: productInclude() });
    if (!product) throw new ApiError("PRODUCT_NOT_FOUND", "Product not found", 404);
    return decorate(product);
  });

  app.get("/api/v1/products/by-slug/:slug", async (request) => {
    const { slug } = slugParamSchema.parse(request.params);
    const product = await app.prisma.product.findFirst({ where: { slug, isActive: true, offers: { some: { isActive: true } } }, include: productInclude() });
    if (!product) throw new ApiError("PRODUCT_NOT_FOUND", "Product not found", 404);
    return decorate(product);
  });
};

