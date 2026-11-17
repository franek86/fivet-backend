import { z } from "zod";

export const STATUSES = ["OPEN", "RESPONDED", "CLOSED"] as const;
export const SORT_FIELDS = ["createdAt", "senderName", "shipName", "status"] as const;

export const createInquirySchema = z.object({
  senderName: z.string().min(2).max(100),
  senderEmail: z.string().email(),
  senderPhone: z.string().max(30).optional(),
  subject: z.string().trim().min(3).max(150),
  message: z.string().min(10).max(2000),
});

export const idParamsSchema = z.object({ id: z.string().uuid() });
export const updateStatusSchema = z.object({ status: z.enum(["OPEN", "RESPONDED", "CLOSED"]) });

export const listQuerySchema = z.object({
  box: z.enum(["received", "sent"]).default("received"),
  status: z.enum(STATUSES).optional(),
  search: z.string().trim().max(100).optional(),
  sortBy: z.enum(SORT_FIELDS).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
});
