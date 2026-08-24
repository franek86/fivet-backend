import express from "express";
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

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  requireRole("ADMIN"),
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "blockImages", maxCount: 30 },
    { name: "gallery", maxCount: 10 },
  ]),
  createPost,
);
router.get("/", authenticateUser, requireRole("ADMIN"), getAllPosts);
router.patch(
  "/:id",
  /*  authenticateUser,
  authAdmin, */
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "blockImages", maxCount: 30 },
    { name: "gallery", maxCount: 10 },
  ]),
  updatePost,
);
router.get("/published", getPublishedPosts);
router.delete("/:id", authenticateUser, requireRole("ADMIN"), deletePost);
router.get("/:slug", getSinglePostBySlug);
router.get("/admin/:slug", getSinglePostBySlugProtected);

export default router;
