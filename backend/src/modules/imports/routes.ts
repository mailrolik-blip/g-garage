import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";
import { ApiError } from "../../plugins/error-handler.js";

const supplierItemsQuerySchema = z.object({
  status: z.enum(["UNMATCHED", "AUTO_MATCHED", "MANUAL_MATCHED", "NEEDS_REVIEW", "REJECTED"]).optional(),
  supplierId: z.string().optional(),
  search: z.string().trim().min(1).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});

export const internalImportRoutes: FastifyPluginAsync = async (app) => {
  if (env.NODE_ENV === "production") return;

  app.get("/internal/catalog-imports/:id/summary", async (request) => {
    const { id } = z.object({ id: z.string().min(1) }).parse(request.params);
    const importRecord = await app.prisma.priceImport.findUnique({ where: { id }, include: { supplier: true } });
    if (!importRecord) throw new ApiError("IMPORT_NOT_FOUND", "Import not found", 404);
    const [itemsByStatus, issueCount, candidateCount] = await Promise.all([
      app.prisma.supplierCatalogItem.groupBy({ by: ["matchingStatus"], where: { lastImportId: id }, _count: true }),
      app.prisma.importReviewIssue.count({ where: { importId: id } }),
      app.prisma.productMatchCandidate.count({ where: { supplierCatalogItem: { lastImportId: id } } }),
    ]);
    return { import: importRecord, itemsByStatus, issueCount, candidateCount };
  });

  app.get("/internal/supplier-items", async (request) => {
    const query = supplierItemsQuerySchema.parse(request.query);
    const where = {
      ...(query.status ? { matchingStatus: query.status } : {}),
      ...(query.supplierId ? { supplierId: query.supplierId } : {}),
      ...(query.search ? { OR: [{ sourceArticle: { contains: query.search, mode: "insensitive" as const } }, { sourceName: { contains: query.search, mode: "insensitive" as const } }] } : {}),
    };
    const [total, data] = await Promise.all([
      app.prisma.supplierCatalogItem.count({ where }),
      app.prisma.supplierCatalogItem.findMany({
        where,
        include: { supplier: true, warehouse: true, matchedProduct: { include: { brand: true } }, candidates: { include: { product: { include: { brand: true } } }, orderBy: { score: "desc" }, take: 3 } },
        orderBy: [{ matchingStatus: "asc" }, { sourceRowNumber: "asc" }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
    ]);
    return { data, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  });
};