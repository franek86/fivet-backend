import express from "express";
import multer from "multer";
import { changeAvatar, changePassword, confirmEmailChange, freezeAccount, requestEmailChange } from "../controllers/settingsController";
import { authenticateUser } from "../middleware/verifyToken";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => cb(null, ["image/jpeg", "image/png", "image/webp"].includes(file.mimetype)),
});

const router = express.Router();

router.patch("/password", authenticateUser, changePassword);
router.post("/email/request", authenticateUser, requestEmailChange);
router.post("/email/confirm", authenticateUser, confirmEmailChange);
router.patch("/avatar", authenticateUser, upload.single("avatar"), changeAvatar);
router.post("/freeze", authenticateUser, freezeAccount);

export default router;
