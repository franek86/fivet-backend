import express from "express";
import { authAdmin, authenticateUser } from "../middleware";
import { getAdminDashboardStatistic, getEarnings, getCurrentUserStats, getGeoWorld } from "../controllers/dashboardController";

const router = express.Router();

router.get("/admin-statistic", authenticateUser, authAdmin, getAdminDashboardStatistic);
router.get("/admin-earnings", authenticateUser, authAdmin, getEarnings);
router.get("/user-statistic", authenticateUser, getCurrentUserStats);
router.get("/geo/world", authenticateUser, authAdmin, getGeoWorld);

export default router;
