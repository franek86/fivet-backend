import express from "express";
import { deleteUserProfile, getAllProfiles, getLastFiveProfile, getUserProfile, updateProfile } from "../controllers/profileController";
import { authAdmin, authenticateUser } from "../middleware";
import upload from "../middleware/uploads";
import { profileImageUpload } from "../middleware/profileImageUpload";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getAllProfiles);
router.get("/last-users", authenticateUser, authAdmin, getLastFiveProfile);
router.get("/:id", authenticateUser, getUserProfile);
//router.post("/create", authenticateUser, upload.single("avatar"), createProfile);
router.patch("/update", authenticateUser, upload.single("avatar"), profileImageUpload("put"), updateProfile);
router.delete("/:id", authenticateUser, authAdmin, deleteUserProfile);
export default router;
