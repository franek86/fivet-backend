import express from "express";
import { createPost } from "../controllers/postController";

import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";
import { bannerImageUpload } from "../middleware/bannerImageUpload";

const router = express.Router();

router.post("/", upload.single("bannerImage"), bannerImageUpload("post"), createPost); //authenticateUser, authAdmin,

export default router;
