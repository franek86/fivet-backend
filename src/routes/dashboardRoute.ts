import express from "express";
import { getEarnings, getCurrentUserStats } from "../controllers/dashboardController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.get("/admin-earnings", authenticateUser, requireRole("ADMIN"), getEarnings);
router.get("/user-statistic", authenticateUser, getCurrentUserStats);

export default router;
