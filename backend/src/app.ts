import Fastify from "fastify";
import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";
import { env, corsOrigins } from "./config/env.js";
import { errorHandlerPlugin } from "./plugins/error-handler.js";
import { prismaPlugin } from "./plugins/prisma.js";
import { healthRoutes } from "./modules/health/routes.js";
import { categoryRoutes } from "./modules/categories/routes.js";
import { brandRoutes } from "./modules/brands/routes.js";
import { productRoutes } from "./modules/products/routes.js";

export async function buildApp() {
  const app = Fastify({ logger: { level: env.LOG_LEVEL } });
  await app.register(errorHandlerPlugin);
  await app.register(cors, { origin: corsOrigins });
  await app.register(rateLimit, { max: 240, timeWindow: "1 minute" });
  await app.register(prismaPlugin);
  await app.register(healthRoutes);
  await app.register(categoryRoutes);
  await app.register(brandRoutes);
  await app.register(productRoutes);
  return app;
}
