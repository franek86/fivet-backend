import z from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

export const PostCategorySchema = z.object({
  title: z.string().trim().min(1).max(50),
  slug: slugSchema,
});
