import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import { env } from "../../config/env.js";

const listQuerySchema = z.object({
  status: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
});
const idParamSchema = z.object({ id: z.string().min(1) });

export const enrichmentRoutes: FastifyPluginAsync = async (app) => {
  if (env.NODE_ENV === "production") {
    app.get("/internal/enrichment/jobs", async (_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } }));
    app.get("/internal/enrichment/jobs/:id", async (_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } }));
    app.get("/internal/enrichment/jobs/:id/candidates", async (_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } }));
    app.get("/internal/enrichment/candidates/:id", async (_request, reply) => reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } }));
    return;
  }

  app.get("/internal/enrichment/jobs", async () => app.prisma.enrichmentJob.findMany({ orderBy: { createdAt: "desc" } }));

  app.get("/internal/enrichment/jobs/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const job = await app.prisma.enrichmentJob.findUnique({ where: { id }, include: { _count: { select: { candidates: true } } } });
    if (!job) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } });
    return job;
  });

  app.get("/internal/enrichment/jobs/:id/candidates", async (request) => {
    const { id } = idParamSchema.parse(request.params);
    const query = listQuerySchema.parse(request.query);
    const where = { jobId: id, status: query.status as any };
    const [total, candidates] = await Promise.all([
      app.prisma.enrichmentCandidate.count({ where }),
      app.prisma.enrichmentCandidate.findMany({ where, include: { supplierCatalogItem: true, _count: { select: { evidence: true, decisions: true } } }, orderBy: { createdAt: "asc" }, skip: (query.page - 1) * query.limit, take: query.limit }),
    ]);
    return { data: candidates, pagination: { page: query.page, limit: query.limit, total, pages: Math.ceil(total / query.limit) } };
  });

  app.get("/internal/enrichment/candidates/:id", async (request, reply) => {
    const { id } = idParamSchema.parse(request.params);
    const candidate = await app.prisma.enrichmentCandidate.findUnique({ where: { id }, include: { supplierCatalogItem: true, evidence: { orderBy: { reliabilityScore: "desc" } }, decisions: { orderBy: { createdAt: "desc" } } } });
    if (!candidate) return reply.code(404).send({ error: { code: "NOT_FOUND", message: "Not found", details: null } });
    return candidate;
  });
};

