import express from "express";

import { authAdmin, authenticateUser } from "../middleware";
import { createPostCategory, getBlogCategories } from "../controllers/postCategoryController";

const router = express.Router();

router.post("/", authenticateUser, authAdmin, createPostCategory);
router.get("/", authenticateUser, authAdmin, getBlogCategories);

export default router;
