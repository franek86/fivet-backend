import express from "express";

import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { editCompnyProfile, getCompanyProfile } from "../controllers/companyCotroller";

const router = express.Router();

router.get("/", authenticateUser, requireRole("ADMIN", "BROKER", "OWNER", "BUYER"), getCompanyProfile);
router.patch("/", authenticateUser, requireRole("ADMIN", "BROKER", "OWNER", "BUYER"), editCompnyProfile);

export default router;
