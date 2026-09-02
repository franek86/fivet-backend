import express from "express";
import { sendBrokerRequestToOwner } from "../controllers/brokerAssignmentController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.post("/:id", authenticateUser, requireRole("ADMIN", "BROKER", "OWNER"), sendBrokerRequestToOwner);

export default router;
