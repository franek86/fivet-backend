import express from "express";

import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { getAllUsers } from "../controllers/usersController";
const router = express.Router();

router.get("/", authenticateUser, requireRole("ADMIN"), getAllUsers);

export default router;
