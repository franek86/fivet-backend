import express from "express";
import { authAdmin, authenticateUser } from "../middleware";
import { getNotifications, getUnreadNotification, updateUnreadNotification } from "../controllers/notificationController";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getNotifications);
router.get("/unread", authenticateUser, authAdmin, getUnreadNotification);
router.put("/:id/read", authenticateUser, authAdmin, updateUnreadNotification);

export default router;
