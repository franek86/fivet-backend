import express from "express";
import {
  createPost,
  deletePost,
  getAllPosts,
  getPublishedPosts,
  getSinglePostBySlug,
  getSinglePostBySlugProtected,
} from "../controllers/postController";

import { authAdmin, authenticateUser, checkShipsLimit } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  authAdmin,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "blockImages", maxCount: 30 },
    { name: "gallery", maxCount: 10 },
  ]),
  createPost,
);
router.get("/", authenticateUser, authAdmin, getAllPosts);
router.get("/published", getPublishedPosts);
router.delete("/:id", authenticateUser, authAdmin, deletePost);
router.get("/:slug", getSinglePostBySlug);
router.get("/admin/:slug", getSinglePostBySlugProtected);

export default router;
