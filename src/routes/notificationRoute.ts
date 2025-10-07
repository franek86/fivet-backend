import express from "express";
import { authAdmin, authenticateUser } from "../middleware";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotification,
  updateUnreadNotification,
} from "../controllers/notificationController";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getNotifications);
router.get("/unread", authenticateUser, authAdmin, getUnreadNotification);
router.put("/:id/read", authenticateUser, authAdmin, updateUnreadNotification);
router.delete("/:id", authenticateUser, authAdmin, deleteNotification);

export default router;
