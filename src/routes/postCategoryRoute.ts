import express from "express";

import { authAdmin, authenticateUser } from "../middleware";
import { createPostCategory } from "../controllers/postCategoryController";

const router = express.Router();

router.post("/", authenticateUser, authAdmin, createPostCategory);

export default router;
