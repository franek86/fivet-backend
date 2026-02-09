import express from "express";
import { authAdmin, authenticateUser } from "../middleware";
import { getDashboardStatistic, getEarnings } from "../controllers/dashboardController";

const router = express.Router();

router.get("/statistic", authenticateUser, getDashboardStatistic);
router.get("/earnings", authenticateUser, authAdmin, getEarnings);

export default router;
