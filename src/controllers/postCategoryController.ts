import { Response, Request } from "express";
import prisma from "../prismaClient";
import { PostCategorySchema } from "../schemas/postCategory.schema";

export const createPostCategory = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(401).json({ message: "Unauthorized " });
    return;
  }
  try {
    const validateData = PostCategorySchema.parse(req.body);
    if (!validateData) {
      res.status(400).json({ message: "Validation failed" });
      return;
    }

    const newCategory = await prisma.postCategory.create({ data: validateData });
    res.status(200).json({ message: "Blog category successfully created", newCategory });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
