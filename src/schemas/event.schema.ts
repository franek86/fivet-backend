import z from "zod";

export const EventStatusEnum = z.enum(["PLANNED", "DONE", "CANCELLED"]);
export const EventPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH"]);

export const CreateEventSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  start: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
  end: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
  location: z.string().optional(),
  reminder: z.coerce.number().optional(),
  status: EventStatusEnum.optional().default("PLANNED"),
  priority: EventPriorityEnum.optional().default("MEDIUM"),
  tags: z.array(z.string()).optional(),
  userId: z.string().uuid("User ID must be valid"),
});

export const EditEventSchema = CreateEventSchema.partial().extend({
  status: EventStatusEnum.optional().default("PLANNED"),
  priority: EventPriorityEnum.optional().default("MEDIUM"),
});

export const FilterEventSchema = z.object({
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
  pageNumber: z.coerce.number().default(1),
  pageSize: z.coerce.number().default(10),
});

export type CreateEventInput = z.infer<typeof CreateEventSchema>;
export type FilterEventQuery = z.infer<typeof FilterEventSchema>;
export type EditEventInput = z.infer<typeof EditEventSchema>;
