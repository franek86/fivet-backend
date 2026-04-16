import z from "zod";

export const PostStatusEnum = z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]);

export const PostBlockSchema = z.object({
  text: z.string().optional(),
  imageUrl: z.string().url().optional(),
  imageAlt: z.string().optional(),
  order: z.number().int().min(0),
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
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  status: PostStatusEnum.optional(),
  tags: z.array(z.string()).default([]),
  bannerImage: z.string().url().optional(),
  bannerImageAlt: z.string().optional(),
  categoryId: z.number().int().optional(),
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
