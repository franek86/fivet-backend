import express from "express";

import { createPostCategory, getBlogCategories } from "../controllers/postCategoryController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.post("/", authenticateUser, requireRole("ADMIN"), createPostCategory);
router.get("/", authenticateUser, requireRole("ADMIN"), getBlogCategories);

export default router;
