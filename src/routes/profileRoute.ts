import express from "express";
import { getAllProfiles, getUserProfile } from "../controllers/profileController";
import { authAdmin, authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getAllProfiles);
router.get("/:id", authenticateUser, getUserProfile);
export default router;
