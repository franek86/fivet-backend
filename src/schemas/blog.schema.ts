import z from "zod";

// multipart/form-data sending data as a string, we parsing to JSON
const stringArray = z.preprocess(
  (v) => {
    if (Array.isArray(v)) return v;
    if (typeof v !== "string" || !v.trim()) return [];
    try {
      const parsed = JSON.parse(v);
      if (Array.isArray(parsed)) return parsed;
    } catch {}
    return v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  },
  z.array(z.string().min(1)),
);

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens");

export const PostStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const PostGallerySchema = z.object({
  url: z.string().url(),
  alt: z.string().trim().optional(),
  publicId: z.string().optional(),
});

export const CreatePostSchema = z.object({
  title: z.string().trim().min(1).max(150),
  slug: slugSchema,
  subTitle: z.string().trim().max(200).nullish().optional(),
  shortDescription: z.string().trim().max(300).optional(),
  content: z.string().min(1),

  bannerImage: z.string().url().optional(),
  bannerImageAlt: z.string().trim().min(3).max(150).optional(),
  bannerPublicId: z.string().optional(),

  status: PostStatusEnum.default("DRAFT"),

  tags: stringArray.pipe(z.array(z.string().max(30)).max(15)).default([]),
  categoryId: z.string().trim().min(1),

  gallery: z.array(PostGallerySchema).default([]),

  publishedAt: z.coerce.date().optional(),

  metaTitle: z.string().trim().max(80).nullish().optional(),
  metaDescription: z.string().trim().max(200).nullish().optional(),
  metaKeywords: stringArray.pipe(z.array(z.string().max(40)).max(15)).default([]),

  ogImage: z.string().url().nullish().optional(),
  canonicalUrl: z.string().url().nullish().optional(),
});

export const UpdatePostSchema = CreatePostSchema.partial().extend({
  deleteImageIds: z.array(z.string()).optional(),
  existingImagesMeta: z
    .array(
      z.object({
        id: z.string(),
        alt: z.string().optional(),
      }),
    )
    .optional(),
});

export const BlogFilterSchema = z.object({
  categories: z.string().optional(),
  tags: z.string().optional(),
  dateFrom: z.coerce.date().optional(),
  dateTo: z.coerce.date().optional(),
  status: PostStatusEnum.optional().default("DRAFT"),
  search: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(12),
  sortBy: z.enum(["title", "createdAt", "updatedAt", "views"]).default("createdAt"),
  order: z.enum(["asc", "desc"]).default("desc"),
});

export type BlogFilters = z.infer<typeof BlogFilterSchema>;
export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
