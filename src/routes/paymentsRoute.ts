import express from "express";
import { getPaymentDetails, getPayments } from "../controllers/paymentsController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", authenticateUser, requireRole("ADMIN"), getPayments);
router.get("/:sessionId", getPaymentDetails);

export default router;
