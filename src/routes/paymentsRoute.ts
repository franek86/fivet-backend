import express from "express";
import { deletePayment, getPayments } from "../controllers/paymentsController";
import { authAdmin, authenticateUser } from "../middleware";

const router = express.Router();

router.get("/", authenticateUser, authAdmin, getPayments);
router.delete("/:id", authenticateUser, authAdmin, deletePayment);

export default router;
