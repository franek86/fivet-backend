import express from "express";
import { editBrokerRequestToUser, sendBrokerRequestToOwner } from "../controllers/brokerAssignmentController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.post("/:id", authenticateUser, requireRole("ADMIN", "BROKER", "OWNER"), sendBrokerRequestToOwner);
router.put("/edit-broker-request", authenticateUser, requireRole("OWNER"), editBrokerRequestToUser);

export default router;
