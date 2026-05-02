import { Request, Response } from "express";
import prisma from "../prismaClient";

import { CreatePostSchema } from "../schemas/post.schema";
import { uploadSingleFileToCloudinary } from "../cloudinaryConfig";

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
    };

    /* Upload banner image */
    const bannerFile = files.bannerImage?.[0] ?? null;
    const bannerImage = bannerFile ? await uploadSingleFileToCloudinary(bannerFile.buffer, "posts/bannerImage") : null;

    /* Block images */
    const blocks = req.body.blocks;
    const blockImages = files.blockImages || [];

    const createdBlocks = await Promise.all(
      blocks.map(async (block: any, index: number) => {
        const imageFile = blockImages[index];

        const image = imageFile ? await uploadSingleFileToCloudinary(imageFile.buffer, "posts/blockImage") : null;

        return {
          text: block.text,
          imageAlt: block.imageAlt,
          imageUrl: image?.secure_url,
        };
      }),
    );

    const validateData = CreatePostSchema.parse({
      ...req.body,
      authorId: String(userId),
      bannerImage: bannerImage?.secure_url,
      blocks: createdBlocks,
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
