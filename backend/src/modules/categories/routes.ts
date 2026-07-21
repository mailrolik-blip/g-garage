import type { FastifyPluginAsync } from "fastify";
import { ApiError } from "../../plugins/error-handler.js";
import { slugParamSchema } from "../../lib/validation.js";

export const categoryRoutes: FastifyPluginAsync = async (app) => {
  app.get("/api/v1/categories", async () => app.prisma.category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }));
  app.get("/api/v1/categories/:slug", async (request) => {
    const { slug } = slugParamSchema.parse(request.params);
    const category = await app.prisma.category.findUnique({ where: { slug } });
    if (!category || !category.isActive) throw new ApiError("CATEGORY_NOT_FOUND", "Category not found", 404);
    return category;
  });
};
