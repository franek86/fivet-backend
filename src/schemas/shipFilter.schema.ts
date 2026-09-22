import { z } from "zod";

export const ShipFilterSchema = z.object({
  search: z.string().trim().optional(),
  shipType: z
    .string()
    .optional()
    .transform((value) =>
      value
        ? value
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
        : [],
    ),
  isPublished: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => (value === undefined ? undefined : value === "true")),

  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(["createdAt", "price", "shipName", "dwt", "beam", "draft"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type ShipFilters = z.infer<typeof ShipFilterSchema>;
