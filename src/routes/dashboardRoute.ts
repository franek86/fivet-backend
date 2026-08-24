import express from "express";
import { getAdminDashboardStatistic, getEarnings, getCurrentUserStats } from "../controllers/dashboardController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.get("/admin-statistic", authenticateUser, requireRole("ADMIN"), getAdminDashboardStatistic);
router.get("/admin-earnings", authenticateUser, requireRole("ADMIN"), getEarnings);
router.get("/user-statistic", authenticateUser, getCurrentUserStats);
/* router.get("/geo/world", authenticateUser, requireRole("ADMIN"), getGeoWorld); */

export default router;
