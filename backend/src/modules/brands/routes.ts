import type { FastifyPluginAsync } from "fastify";
import { ApiError } from "../../plugins/error-handler.js";
import { slugParamSchema } from "../../lib/validation.js";

export const brandRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/brands", async () => app.prisma.brand.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }));
  app.get("/api/v1/brands/:slug", async (request) => {
    const { slug } = slugParamSchema.parse(request.params);
    const brand = await app.prisma.brand.findUnique({ where: { slug } });
    if (!brand || !brand.isActive) throw new ApiError("BRAND_NOT_FOUND", "Brand not found", 404);
    return brand;
  });
};
