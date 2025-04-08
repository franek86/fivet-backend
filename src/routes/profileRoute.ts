import express from "express";
import { createProfile, getAllProfiles, getUserProfile, updateProfile } from "../controllers/profileController";
import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getAllProfiles);
router.get("/:id", authenticateUser, getUserProfile);
router.post("/create", authenticateUser, upload.single("avatar"), createProfile);
router.patch("/update", authenticateUser, upload.single("avatar"), updateProfile);
export default router;
