import express from "express";

import { changeAvatar, changePassword, confirmEmailChange, freezeAccount, requestEmailChange } from "../controllers/settingsController";
import { authenticateUser } from "../middleware/verifyToken";

import upload from "../middleware/uploads";

const router = express.Router();

router.patch("/password", authenticateUser, changePassword);
router.post("/email/request", authenticateUser, requestEmailChange);
router.post("/email/confirm", authenticateUser, confirmEmailChange);
router.patch("/avatar", authenticateUser, upload.single("avatar"), changeAvatar);
router.post("/freeze", authenticateUser, freezeAccount);

export default router;
