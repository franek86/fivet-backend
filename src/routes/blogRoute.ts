import express, { Request, Response } from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPublishedPosts,
  getSinglePostBySlug,
  getSinglePostBySlugProtected,
  updatePost,
} from "../controllers/postController";

import { checkShipsLimit } from "../middleware";
import upload from "../middleware/uploads";
import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { uploadSingleFile } from "../services/cloundinary.service";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  requireRole("ADMIN"),
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  createPost,
);
router.get("/", authenticateUser, requireRole("ADMIN"), getAllPosts);
router.patch(
  "/:id",
  authenticateUser,
  requireRole("ADMIN"),
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "gallery", maxCount: 10 },
  ]),
  updatePost,
);
router.get("/published", getPublishedPosts);
router.delete("/:id", authenticateUser, requireRole("ADMIN"), deletePost);
router.get("/:slug", getSinglePostBySlug);
router.get("/admin/:slug", getSinglePostBySlugProtected);

//upload image fron blog content
router.post("/uploads/image", authenticateUser, requireRole("ADMIN"), upload.single("image"), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ message: "Image is required" });
  const { url, publicId } = await uploadSingleFile(req.file.buffer, "posts/blockImage");
  res.status(201).json({ url, publicId });
});

export default router;
