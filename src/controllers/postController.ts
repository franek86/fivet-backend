import { Request, Response } from "express";
import prisma from "../prismaClient";

import { CreatePostSchema } from "../schemas/post.schema";

/* Create post. admin only */
export const createPost = async (req: Request, res: Response) => {
  /* const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  } */

  try {
    const validateData = CreatePostSchema.parse(req.body);

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
