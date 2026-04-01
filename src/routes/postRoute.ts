import express from "express";

import { authAdmin, authenticateUser } from "../middleware";
import { createPost } from "../controllers/postController";

const router = express.Router();

router.post("/", createPost); //authenticateUser, authAdmin,

export default router;
