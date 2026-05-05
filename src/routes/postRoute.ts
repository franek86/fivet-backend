import express from "express";
import { createPost, getAllPosts, getPublishedPosts } from "../controllers/postController";

import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.post(
  "/",
  authenticateUser,
  authAdmin,
  upload.fields([
    { name: "bannerImage", maxCount: 1 },
    { name: "blockImages", maxCount: 30 },
  ]),
  createPost,
);
router.get("/", authenticateUser, authAdmin, getAllPosts);
router.get("/published", getPublishedPosts);

export default router;
