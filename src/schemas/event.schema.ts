import z from "zod";

export const EventStatusEnum = z.enum(["PLANNED", "DONE", "CANCELLED"]);
export const EventPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

/* const statusEnum = z.enum(["planned", "done", "canceled"]);
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
  reminder: z.number().int().min(0).nullable().optional(),
  status: statusEnum.optional().default("planned"),
  priority: priorityEnum.nullable().optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string().uuid("User ID must be valid"),
}); */

export const CreateEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  location: z.string().optional(),
  reminder: z.number().int().optional(),
  status: EventStatusEnum.optional().default("PLANNED"),
  priority: EventPriorityEnum.optional(),
  tags: z.array(z.string()).optional(),
  userId: z.string().uuid("User ID must be valid"),
});

export const filterEventSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),

  startDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),
  endDate: z
    .string()
    .transform((val) => new Date(val))
    .optional(),

  search: z.string().optional(),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
