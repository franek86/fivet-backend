import express from "express";

import { authenticateUser } from "../middleware/verifyToken";
import { editCompnyProfile, getCompanyProfile } from "../controllers/companyCotroller";
import upload from "../middleware/uploads";

const router = express.Router();

router.get("/", authenticateUser, getCompanyProfile);
router.patch("/", authenticateUser, upload.single("logo"), editCompnyProfile);

export default router;
