import z from "zod";

export const PostStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

// single item inside a column cell
const columnItemSchema = z.object({
  id: z.string(),
  type: z.enum(["text", "image"]),
});

// one column = array of items
const columnSchema = z.array(columnItemSchema);

export const PostBlockSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),
  imageAlt: z.string().nullable().optional(),

  blockImagePublicId: z.string().nullable().optional(),
  order: z.number().int().min(0).default(0),
});

export const PostGallerySchema = z.object({
  url: z.string().url(),
  alt: z.string().optional(),
  publicId: z.string().optional(),
});

export const CreatePostSchema = z.object({
  authorId: z.string().uuid(),
  title: z.string().min(1),
  subTitle: z.string().optional(),
  shortDescription: z.string().optional(),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  status: PostStatusEnum.optional(),
  tags: z.array(z.string()).default([]),
  bannerImage: z.string().url().optional(),
  bannerImageAlt: z.string().optional(),
  bannerPublicId: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  blocks: z.array(PostBlockSchema).optional(),
  gallery: z.array(PostGallerySchema).default([]),
  publishedAt: z.coerce.date().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  ogImage: z.string().url().optional(),
  canonicalUrl: z.string().url().optional(),
  /* readingTime: z.number().int().positive().optional(),
  views: z.number().int().positive().default(0), */
});

export const UpdatePostSchema = CreatePostSchema.partial();

export type CreatePostInput = z.infer<typeof CreatePostSchema>;
export type UpdatePostInput = z.infer<typeof UpdatePostSchema>;
