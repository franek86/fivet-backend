"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterEventSchema = exports.CreateEventSchema = exports.EventPriorityEnum = exports.EventStatusEnum = void 0;
const zod_1 = __importDefault(require("zod"));
exports.EventStatusEnum = zod_1.default.enum(["PLANNED", "DONE", "CANCELLED"]);
exports.EventPriorityEnum = zod_1.default.enum(["LOW", "MEDIUM", "HIGH"]);
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
exports.CreateEventSchema = zod_1.default.object({
    title: zod_1.default.string().min(1),
    description: zod_1.default.string().optional(),
    start: zod_1.default.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid start date" }),
    end: zod_1.default.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid end date" }),
    location: zod_1.default.string().optional(),
    reminder: zod_1.default.number().int().optional(),
    status: exports.EventStatusEnum.optional().default("PLANNED"),
    priority: exports.EventPriorityEnum.optional(),
    tags: zod_1.default.array(zod_1.default.string()).optional(),
    userId: zod_1.default.string().uuid("User ID must be valid"),
});
exports.filterEventSchema = zod_1.default.object({
    status: zod_1.default.string().optional(),
    priority: zod_1.default.string().optional(),
    startDate: zod_1.default
        .string()
        .transform((val) => new Date(val))
        .optional(),
    endDate: zod_1.default
        .string()
        .transform((val) => new Date(val))
        .optional(),
    search: zod_1.default.string().optional(),
});
