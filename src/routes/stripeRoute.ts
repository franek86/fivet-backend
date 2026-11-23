import express from "express";
import { authenticateUser } from "../middleware/verifyToken";
import { createStripeCheckout } from "../controllers/stripeController";

const router = express.Router();

router.post("/checkout", authenticateUser, createStripeCheckout);

export default router;
