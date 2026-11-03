import { Request, Response } from "express";
import prisma from "../prismaClient";
import cloudinary from "../config/cloudinary";

import { BlogFilterSchema, CreatePostSchema, UpdatePostSchema } from "../schemas/blog.schema";

import { uploadSingleFile } from "../services/cloundinary.service";
import { buildPageMeta, parsePagination } from "../utils/pagination";
import { parseSortBy } from "../helpers/sort.helpers";
import { blogFilters } from "../utils/blogFilters";

type BlogFliesType = {
  bannerImage?: Express.Multer.File[];
  gallery?: Express.Multer.File[];
};

type GalleryMeta = {
  alt?: string;
};

type ExistingImagesMeta = {
  id: string;
  alt?: string;
};

/*
 * Create post - admin only
 */
export const createPost = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorize" });
    return;
  }

  try {
    const files = (req.files || {}) as BlogFliesType;

    const validatedData = CreatePostSchema.safeParse(req.body);

    if (!validatedData.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validatedData.error.flatten(),
      });
      return;
    }
    const data = validatedData.data;

    const banner = files?.bannerImage?.[0];
    const gallery = files?.gallery || [];

    //Banner image
    let bannerImage: string | null = null;
    let bannerPublicId: string | null = null;
    if (banner) {
      const result = await uploadSingleFile(banner.buffer, "posts/bannerImage");

      bannerImage = result.url;
      bannerPublicId = result.publicId;
    }

    //Gallery images
    const galleryImages = await Promise.all(
      gallery.map(async (image) => {
        const result = await uploadSingleFile(image.buffer, "posts/blogGallery");

        return {
          url: result.url,
          publicId: result.publicId,
        };
      }),
    );

    const publishedAt = data.publishedAt ?? (data.status === "PUBLISHED" ? new Date() : null);

    const newPost = await prisma.post.create({
      data: {
        title: data.title,
        slug: data.slug,
        subTitle: data.subTitle,
        shortDescription: data.shortDescription,
        content: data.content,
        authorId: userId,

        bannerImage,
        bannerPublicId,
        bannerImageAlt: data.bannerImageAlt,

        status: data.status,
        publishedAt,

        tags: data.tags,

        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
        metaKeywords: data.metaKeywords,
        canonicalUrl: data.canonicalUrl,

        categoryId: data.categoryId,

        gallery: {
          create: galleryImages.map((img, index) => ({
            url: img.url,
            publicId: img.publicId,
            alt: data.gallery?.[index]?.alt ?? null,
            order: index,
          })),
        },
      },
      include: {
        category: true,
        gallery: { select: { id: true, url: true, order: true } },
      },
    });

    res.status(201).json({ message: "Post successfully created", newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* get all blog lists */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const result = BlogFilterSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const { where } = blogFilters(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
      }),
      prisma.post.count(where),
    ]);

    const meta = buildPageMeta(totalPosts, filters.page, filters.limit);

    res.status(200).json({
      meta,
      blogs: posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* get only published blogs */
export const getPublishedPosts = async (req: Request, res: Response) => {
  try {
    const { page, skip, limit } = parsePagination(req.query);

    const { sortBy } = req.query;
    const orderBy = parseSortBy(sortBy as string, ["status", "views", "createdAt"], { createdAt: "desc" });

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy,
        where: { status: "PUBLISHED" },
      }),
      prisma.ship.count(),
    ]);

    const meta = buildPageMeta(totalPosts, page, limit);

    res.status(200).json({
      meta,
      data: posts,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/*
  GET SINGLE BLOG BY SLUG 
  PUBLIC
*/
export const getSinglePostBySlug = async (req: Request<{ slug: string }>, res: Response): Promise<any> => {
  const { slug } = req.params;
  if (!slug) return res.status(404).json({ message: "Post slug not exists" });
  try {
    const currentBlog = await prisma.post.findUnique({
      where: { slug, status: "PUBLISHED" },
      include: {
        category: true,
      },
    });
    if (!currentBlog) {
      res.status(404).json({
        success: false,
        message: "Blog not found",
      });

      return;
    }

    res.status(200).json(currentBlog);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/*
  GET SINGLE BLOG BY SLUG 
  PROTECTED
*/
export const getSinglePostBySlugProtected = async (req: Request<{ slug: string }>, res: Response): Promise<any> => {
  const { slug } = req.params;
  if (!slug) return res.status(404).json({ message: "Post slug not exists" });
  try {
    const currentBlog = await prisma.post.findUnique({
      where: { slug },
      include: {
        gallery: true,
        category: true,
      },
    });
    if (!currentBlog) {
      res.status(404).json({
        success: false,
        message: "Blog not found",
      });

      return;
    }

    res.status(200).json(currentBlog);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
DELETE POST BY ID 
*/
export const deletePost = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const currentPost = await prisma.post.findUnique({
      where: { id },
      include: {
        gallery: true,
      },
    });

    if (!currentPost) {
      res.status(404).json({ message: "Post not found" });
    }

    const galleryPublicIds = currentPost?.gallery?.map((img: any) => img.publicId).filter(Boolean) || [];
    const bannerPublicId = currentPost?.bannerPublicId;

    const allPublicIds = [...galleryPublicIds, bannerPublicId];

    // Delete only existing assets
    await Promise.all(
      allPublicIds.map(async (publicId) => {
        try {
          const result = await cloudinary.uploader.destroy(publicId);

          // Cloudinary returns "not found" if asset doesn't exist
          if (result.result !== "ok" && result.result !== "not found") {
            console.error(`Failed to delete ${publicId}`, result);
          }
        } catch (error) {
          console.error(`Error deleting ${publicId}`, error);
        }
      }),
    );

    await prisma.post.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATED POST BY ID
  PROTECTED - ADMIN ONLY
*/
export const updatePost = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  // Track uploaded files for cleanup if database update fails.
  const uploadedPublicIds: string[] = [];

  try {
    // 1.Find existing blog
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        gallery: true,
      },
    });

    if (!existingPost) {
      res.status(404).json({ message: "Post not found" });
      return;
    }

    // 2. Parse FormData JSON fields
    let galleryMeta: GalleryMeta[];
    let existingImagesMeta: ExistingImagesMeta[];
    let deleteImageIds: string[];
    let tags: string[] | undefined;

    galleryMeta = req.body.galleryMeta;
    existingImagesMeta = JSON.parse(req.body.existingImagesMeta || []);
    deleteImageIds = JSON.parse(req.body.deleteImageIds || []);
    tags = req.body.tags !== undefined ? JSON.parse(req.body.tags) : undefined;

    // 3.Validate body
    const validatedData = UpdatePostSchema.safeParse({
      ...req.body,
      ...(tags !== undefined && { tags }),
    });

    if (!validatedData.success) {
      res.status(400).json({
        message: "Validation failed",
        errors: validatedData.error.flatten(),
      });
      return;
    }

    const data = validatedData.data;

    // 4.Get files
    const files = (req.files || {}) as BlogFliesType;

    const banner = files.bannerImage?.[0];
    const gallery = files.gallery ?? [];

    // 5. Upload new banner if provided
    let newBanner = null;
    if (banner) {
      const result = await uploadSingleFile(banner.buffer, "posts/bannerImage");
      newBanner = {
        url: result.url,
        publicId: result.publicId,
      };

      uploadedPublicIds.push(result.publicId);
    }

    // 6. Upload new gallery images
    const newGalleryImages = await Promise.all(
      gallery.map(async (image, index) => {
        const result = await uploadSingleFile(image.buffer, "posts/blogGallery");

        uploadedPublicIds.push(result.publicId);

        return {
          url: result.url,
          publicId: result.publicId,
          alt: galleryMeta[index]?.alt ?? "",
        };
      }),
    );

    // 7. Find selected images to delete
    const imagesToDelete = existingPost.gallery.filter((image) => deleteImageIds.includes(image.id));

    /* ---------------- Gallery ---------------- */

    /*  const galleryMeta = req.body.galleryMeta || []; */

    /*  let formattedGallery: any[] = [];

    if (gallery.length > 0) {
      // delete old gallery images from Cloudinary + DB
      await Promise.all(
        existingPost.gallery.map(async (img) => {
          if (img.publicId) {
            await cloudinary.uploader.destroy(img.publicId);
          }
        }),
      );

      const uploadedGallery = await uploadSingleFile(gallery.buffer, "posts/blogGallery");

      formattedGallery = uploadedGallery.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        alt: galleryMeta[index]?.alt || "",
      }));
    } */

    /* ---------------- Delete selected gallery images ---------------- */

    /* const deleteImageIds: string[] = JSON.parse(req.body.deleteImageIds || "[]"); */

    /*  if (deleteImageIds.length > 0) {
      const imagesToDelete = existingPost.gallery.filter((img) => deleteImageIds.includes(img.id));

      await Promise.all(
        imagesToDelete.map(async (img) => {
          if (img.publicId) {
            await cloudinary.uploader.destroy(img.publicId);
          }
        }),
      );

      await prisma.postGallery.deleteMany({
        where: {
          id: { in: deleteImageIds },
          postId: id,
        },
      });
    } */

    /* ---------------- Update existing gallery meta data ---------------- */

    /* const existingImagesMeta: { id: string; alt?: string }[] = JSON.parse(req.body.existingImagesMeta || []); */

    /* await Promise.all(
      existingImagesMeta.map((img) => {
        return prisma.postGallery.updateMany({
          where: { id: img.id, postId: id },
          data: { alt: img.alt },
        });
      }),
    ); */

    /* ---------------- Update ---------------- */

    const updatedPost = await prisma.$transaction(async (tx) => {
      await tx.post.update({
        where: { id },
        data: {
          title: data.title,
          slug: data.slug,
          shortDescription: data.shortDescription,
          authorId: userId,

          tags: data.tags,
          category: {
            connect: {
              id: data.categoryId,
            },
          },

          bannerImageAlt: data.bannerImageAlt,

          metaTitle: data.metaTitle,
          metaKeywords: data.metaKeywords,
          metaDescription: data.metaDescription,

          ...(newBanner && {
            bannerImage: newBanner.url,
            bannerPublicId: newBanner.publicId,
          }),

          gallery: {
            // Delete selected gallery records
            ...(imagesToDelete.length > 0 && {
              deleteMany: {
                id: {
                  in: imagesToDelete.map((image) => image.id),
                },
              },
            }),

            // Add new gallery images
            ...(newGalleryImages.length > 0 && {
              create: newGalleryImages,
            }),
          },
        },
      });

      // Update existing gallery alt descriptions
      for (const image of existingImagesMeta) {
        if (deleteImageIds.includes(image.id)) continue;

        await tx.postGallery.updateMany({
          where: {
            id: image.id,
            postId: id,
          },
          data: {
            alt: image.alt ?? "",
          },
        });
      }

      return tx.post.findUnique({
        where: { id },
        include: {
          gallery: true,
        },
      });
    });

    // 9. Delete old Cloudinary images after successful DB update
    const oldPublicIds = [
      ...(newBanner && existingPost.bannerPublicId ? [existingPost.bannerPublicId] : []),

      ...imagesToDelete.map((image) => image.publicId),
    ].filter((publicId): publicId is string => Boolean(publicId));

    await Promise.allSettled(oldPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));

    res.status(200).json({
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    console.error(error);

    // Remove newly uploaded images if update fails
    await Promise.allSettled(uploadedPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));

    res.status(500).json({
      message: "Internal server error",
    });
  }
};
