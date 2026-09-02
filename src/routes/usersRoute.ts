import express from "express";

import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { getAllOwners, getAllUsers, getSingleUserProfile, updateVerifyUserByAdmin } from "../controllers/usersController";
const router = express.Router();

router.get("/", authenticateUser, getAllUsers);
router.get("/owners", authenticateUser, requireRole("BROKER"), getAllOwners);
router.get("/:id", authenticateUser, requireRole("ADMIN"), getSingleUserProfile);
router.patch("/verify-user-account", authenticateUser, requireRole("ADMIN"), updateVerifyUserByAdmin);

export default router;
