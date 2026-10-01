import { z } from "zod";

const PaymentStatus = z.enum(["PENDING", "PAID", "FAILED", "CANCELED"]);

export const PaymentFilterSchema = z.object({
  status: PaymentStatus.optional().default("PENDING"),
  search: z.string().trim().optional(),
  dateFrom: z.date().optional(),
  dateTo: z.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(["createdAt", "amount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaymentFilters = z.infer<typeof PaymentFilterSchema>;
