import { Router } from "express";
import {
  getAdminDashboard,
  getBrokerDashboard,
  getOwnerDashboard,
  getRevenue,
  getUsersByCountry,
} from "../controllers/statisticsController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = Router();

router.get("/admin", authenticateUser, requireRole("ADMIN"), getAdminDashboard);
router.get("/admin/users-by-country", authenticateUser, requireRole("ADMIN"), getUsersByCountry);
router.get("/admin/revenue", authenticateUser, requireRole("ADMIN"), getRevenue);

router.get("/broker", authenticateUser, requireRole("BROKER"), getBrokerDashboard);

router.get("/owner", authenticateUser, requireRole("OWNER"), getOwnerDashboard);

export default router;
