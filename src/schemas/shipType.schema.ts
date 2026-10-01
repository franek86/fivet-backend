import { z } from "zod";

/* SHIP TYPE FILTER SCHEMA */

export const ShipTypeFilterSchema = z.object({
  search: z.string().trim().optional(),
  sortBy: z.enum(["name", "createdAt"]).default("createdAt"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ShipTypeFilterType = z.infer<typeof ShipTypeFilterSchema>;
