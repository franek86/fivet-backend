import express from "express";
import { deletePayment, getPayments } from "../controllers/paymentsController";
import { authenticateUser, requireRole } from "../middleware/verifyToken";

const router = express.Router();

router.get("/", authenticateUser, requireRole("ADMIN"), getPayments);
router.delete("/:id", authenticateUser, requireRole("ADMIN"), deletePayment);

export default router;
