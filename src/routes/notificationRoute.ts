import express from "express";

import {
  deleteNotification,
  getNotifications,
  getUnreadNotification,
  updateUnreadNotification,
} from "../controllers/notificationController";
import { authenticateUser } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", authenticateUser, getNotifications);
router.get("/unread", authenticateUser, getUnreadNotification);
router.put("/:id/read", authenticateUser, updateUnreadNotification);
router.delete("/:id", authenticateUser, deleteNotification);

export default router;
