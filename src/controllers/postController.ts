import { Request, Response } from "express";
import prisma from "../prismaClient";

import { CreatePostSchema, UpdatePostSchema } from "../schemas/post.schema";
import cloudinary, { uploadMultipleFiles, uploadSingleFileToCloudinary } from "../cloudinaryConfig";
import { buildPageMeta, parsePagination } from "../utils/pagination";
import { parseSortBy } from "../helpers/sort.helpers";
import { blogFilters } from "../utils/blogFilters";

/* Create post. admin only */
export const createPost = async (req: Request, res: Response) => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    const files = (req.files || {}) as {
      bannerImage?: Express.Multer.File[];
      blockImages?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    };

    /* Upload banner image */
    const bannerFile = files.bannerImage?.[0] ?? null;
    const bannerImage = bannerFile ? await uploadSingleFileToCloudinary(bannerFile.buffer, "posts/bannerImage") : null;

    /* Block images */
    const blocks = req.body.blocks;
    const blockImages = files.blockImages || [];

    // Upload multiple images in parallel
    const imagesFiles = files.gallery || [];
    const multipleImagesPromise = imagesFiles.length ? await uploadMultipleFiles(imagesFiles, "posts/blogGallery") : Promise.resolve([]);

    const [bannerImageData, blockImageData, galleryData] = await Promise.all([bannerImage, blockImages, multipleImagesPromise]);

    let imagesMeta: { alt?: string }[] = [];
    try {
      imagesMeta = JSON.parse(req.body.galleryMeta || "[]");
    } catch {
      imagesMeta = [];
    }

    const formattedGallery = galleryData.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      alt: imagesMeta[index]?.alt || "",
    }));

    const createdBlocks = blocks
      ? await Promise.all(
          blocks.map(async (block: any, index: number) => {
            const imageFile = blockImageData[index];

            const image = imageFile ? await uploadSingleFileToCloudinary(imageFile.buffer, "posts/blockImage") : null;

            return {
              text: block.text,
              imageAlt: block.imageAlt,
              imageUrl: image?.secure_url,
              blockImagePublicId: image?.public_id,
            };
          }),
        )
      : undefined;

    const validateData = CreatePostSchema.parse({
      ...req.body,
      authorId: String(userId),
      bannerImage: bannerImageData?.secure_url,
      bannerImageAlt: bannerImageData?.alt,
      bannerPublicId: bannerImageData?.public_id,
      blocks: createdBlocks,
      gallery: formattedGallery,
    });
    if (!validateData) {
      return res.status(400).json({ message: "Validation failed" });
    }

    const newPost = await prisma.post.create({
      data: {
        ...validateData,
        blocks: validateData.blocks ? { create: validateData.blocks } : undefined,
        gallery: validateData.gallery ? { create: validateData.gallery } : undefined,
      },
    });

    return res.status(201).json({ message: "Post successfully created", newPost });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* get all blog lists */
export const getAllPosts = async (req: Request, res: Response) => {
  try {
    const { page, skip, limit } = parsePagination(req.query);
    const filters = blogFilters(req.query);
    const { sortBy } = req.query;
    const orderBy = parseSortBy(sortBy as string, ["status", "views", "createdAt"], { createdAt: "desc" });

    const [posts, totalPosts] = await Promise.all([
      prisma.post.findMany({
        skip,
        where: filters,
        take: limit,
        orderBy,
      }),
      prisma.post.count({ where: filters }),
    ]);

    const meta = buildPageMeta(totalPosts, page, limit);

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
        blocks: true,
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
        blocks: true,
      },
    });

    if (!currentPost) {
      res.status(404).json({ message: "Post not found" });
    }

    const galleryPublicIds = currentPost?.gallery?.map((img: any) => img.publicId).filter(Boolean) || [];
    const bannerPublicId = currentPost?.bannerPublicId;
    const blockPublicId = currentPost?.blocks?.map((img: any) => img.blockImagePublicId).filter(Boolean) || [];

    const allPublicIds = [...galleryPublicIds, bannerPublicId, blockPublicId];

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
export const updatePost = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const id = req.params.id as string;

  /* if (!userId) {
    return res.status(401).json({ message: "Unauthorized" });
  } */

  try {
    const existingPost = await prisma.post.findUnique({
      where: { id },
      include: {
        blocks: true,
        gallery: true,
      },
    });

    if (!existingPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    const files = (req.files || {}) as {
      bannerImage?: Express.Multer.File[];
      blockImages?: Express.Multer.File[];
      gallery?: Express.Multer.File[];
    };

    /* ---------------- Banner ---------------- */

    let bannerImageUrl = existingPost?.bannerImage || undefined;
    let bannerPublicId = existingPost?.bannerPublicId || undefined;

    const bannerFile = files.bannerImage?.[0];

    if (bannerFile) {
      // delete old banner if exists
      if (existingPost.bannerPublicId) {
        //await deleteFileFromCloudinary(existingPost.bannerPublicId);
      }

      const uploadedBanner = await uploadSingleFileToCloudinary(bannerFile.buffer, "posts/bannerImage");

      bannerImageUrl = uploadedBanner?.secure_url;
      bannerPublicId = uploadedBanner?.public_id;
    }

    /* ---------------- Gallery ---------------- */

    let formattedGallery: any[] = [];

    const galleryFiles = files.gallery || [];

    if (galleryFiles.length > 0) {
      // remove old gallery images
      await Promise.all(
        existingPost.gallery.map(async (img) => {
          if (img.publicId) {
            //await deleteFileFromCloudinary(img.publicId);
          }
        }),
      );

      const uploadedGallery = await uploadMultipleFiles(galleryFiles, "posts/blogGallery");

      let imagesMeta: { alt?: string }[] = [];

      try {
        imagesMeta = JSON.parse(req.body.galleryMeta || "[]");
      } catch {
        imagesMeta = [];
      }

      formattedGallery = uploadedGallery.map((img, index) => ({
        url: img.url,
        publicId: img.publicId,
        alt: imagesMeta[index]?.alt || "",
      }));
    }

    /* ---------------- Blocks ---------------- */

    let blocks = [];

    try {
      blocks = JSON.parse(req.body.blocks || "[]");
    } catch {
      blocks = [];
    }
    const blockImages = files.blockImages || [];

    const createdBlocks = blocks
      ? await Promise.all(
          blocks.map(async (block: any, index: number) => {
            const imageFile = blockImages[index];

            let imageUrl = block.imageUrl || null;
            let publicId = block.blockImagePublicId || null;

            if (imageFile) {
              if (publicId) {
                //await deleteFileFromCloudinary(publicId);
              }

              const uploadedImage = await uploadSingleFileToCloudinary(imageFile.buffer, "posts/blockImage");

              imageUrl = uploadedImage?.secure_url;
              publicId = uploadedImage?.public_id;
            }

            return {
              text: block.text,
              imageAlt: block.imageAlt,
              imageUrl,
              order: block.order,
              blockImagePublicId: publicId,
            };
          }),
        )
      : undefined;

    /*------------------ Tags --------------------- */
    const tagsParse = typeof req.body.tags === "string" ? JSON.parse(req.body.tags) : req.body.tags;

    /* ---------------- Validation ---------------- */

    const validatedData = UpdatePostSchema.parse({
      ...req.body,
      tags: tagsParse,
      bannerImage: bannerImageUrl,
      bannerPublicId,
      blocks: createdBlocks,
      gallery: formattedGallery.length > 0 ? formattedGallery : undefined,
    });

    /* ---------------- Update ---------------- */

    const updatedPost = await prisma.post.update({
      where: { id },
      data: {
        title: validatedData.title,
        slug: validatedData.slug,
        shortDescription: validatedData.shortDescription,
        tags: validatedData.tags,
        bannerImageAlt: validatedData.bannerImageAlt,
        bannerImage: bannerImageUrl,
        bannerPublicId,

        blocks: {
          deleteMany: {},
          create: createdBlocks,
        },

        ...(formattedGallery.length > 0 && {
          gallery: {
            deleteMany: {},
            create: formattedGallery,
          },
        }),
      },
      include: {
        blocks: true,
        gallery: true,
      },
    });

    return res.status(200).json({
      message: "Post updated successfully",
      updatedPost,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
