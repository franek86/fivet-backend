import express from "express";
import { createPost } from "../controllers/postController";

import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.post("/", upload.fields([{ name: "bannerImage", maxCount: 1 }]), createPost); //authenticateUser, authAdmin,

export default router;
