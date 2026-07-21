import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(24),
});

export const productListQuerySchema = paginationSchema.extend({
  search: z.string().trim().optional(),
  article: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  category: z.string().trim().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.enum(["true", "false"]).optional(),
  qualityLevel: z.enum(["original", "trusted", "budget"]).optional(),
  sort: z.enum(["relevance", "price_asc", "price_desc", "name_asc", "newest", "delivery_fast"]).default("relevance"),
});

export const slugParamSchema = z.object({ slug: z.string().min(1) });
export const idParamSchema = z.object({ id: z.string().min(1) });
