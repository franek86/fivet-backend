import z from "zod";

export const PostCategorySchema = z.object({
  title: z.string().min(1).max(50),
});
