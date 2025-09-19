import express from "express";
import { authenticateUser } from "../middleware";
import { getDashboardStatistic } from "../controllers/dashboardController";

const router = express.Router();

router.get("/statistic", authenticateUser, getDashboardStatistic);

export default router;
