import express from "express";

import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { getAllUsers, updateVerifyUserByAdmin } from "../controllers/usersController";
const router = express.Router();

router.get("/", authenticateUser, requireRole("ADMIN"), getAllUsers);
router.patch("/verify-user-account", authenticateUser, requireRole("ADMIN"), updateVerifyUserByAdmin);

export default router;
