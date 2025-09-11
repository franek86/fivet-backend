"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.eventSchema = void 0;
const zod_1 = __importDefault(require("zod"));
const statusEnum = zod_1.default.enum(["planned", "done", "canceled"]);
const priorityEnum = zod_1.default.enum(["low", "medium", "high"]);
exports.eventSchema = zod_1.default.object({
    title: zod_1.default.string().min(1, "Title is required"),
    description: zod_1.default.string().optional(),
    start: zod_1.default.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date)
            return new Date(arg);
    }, zod_1.default.date({ required_error: "Start date are required" })),
    end: zod_1.default.preprocess((arg) => {
        if (typeof arg === "string" || arg instanceof Date)
            return new Date(arg);
    }, zod_1.default.date({ required_error: "End date are required" })),
    location: zod_1.default.string().optional(),
    reminder: zod_1.default.number().int().min(0).optional(),
    status: statusEnum.optional().default("planned"),
    priority: priorityEnum.optional(),
    tags: zod_1.default.array(zod_1.default.string()).optional(),
    userId: zod_1.default.string().uuid("User ID must be valid"),
});
