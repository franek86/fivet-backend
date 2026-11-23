import { z } from "zod";

const PaymentStatus = z.enum(["PENDING", "PAID", "FAILED", "CANCELED"]);

export const PaymentFilterSchema = z.object({
  status: PaymentStatus.optional(),
  search: z.string().trim().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(["createdAt", "amount"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type PaymentFilters = z.infer<typeof PaymentFilterSchema>;
