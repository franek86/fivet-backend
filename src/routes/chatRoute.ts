import express from "express";
import { authenticateUser, requireRole } from "../middleware/verifyToken";
import { getChatMessages, getConversations } from "../controllers/chatController";

const router = express.Router();

router.get("/:conversationId/messages", authenticateUser, requireRole("BROKER", "OWNER"), getChatMessages);
router.get("/conversations", authenticateUser, requireRole("BROKER", "OWNER"), getConversations);

export default router;
