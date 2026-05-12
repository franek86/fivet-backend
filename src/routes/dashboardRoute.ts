import express from "express";
import { authAdmin, authenticateUser } from "../middleware";
import { getAdminDashboardStatistic, getEarnings, getCurrentUserStats } from "../controllers/dashboardController";
import path from "path";
import fs from "fs";

const router = express.Router();

router.get("/admin-statistic", authenticateUser, authAdmin, getAdminDashboardStatistic);
router.get("/admin-earnings", authenticateUser, authAdmin, getEarnings);
router.get("/user-statistic", authenticateUser, getCurrentUserStats);
router.get("/geo/world", (_req, res) => {
  const filePath = path.join(__dirname, "../../public/geo/world.json");

  const file = fs.readFileSync(filePath, "utf-8");

  res.setHeader("Content-Type", "application/json");

  // aggressive caching (VERY important for dashboards)
  res.setHeader("Cache-Control", "public, max-age=604800, immutable"); // 7 days

  res.send(file);
});

export default router;
