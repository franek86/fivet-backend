import z from "zod";

const statusEnum = z.enum(["planned", "done", "canceled"]);
const priorityEnum = z.enum(["low", "medium", "high"]);

export const eventSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  start: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ required_error: "Start date are required" })),
  end: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) return new Date(arg);
  }, z.date({ required_error: "End date are required" })),
  location: z.string().optional(),
  reminder: z.number().int().min(0).optional(),
  status: statusEnum.optional().default("planned"),
  priority: priorityEnum.optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string().uuid("User ID must be valid"),
});
