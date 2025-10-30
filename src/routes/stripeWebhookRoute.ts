import express from "express";
import { postStripeWebhook } from "../controllers/handleStripeWebhookController";
import bodyParser from "body-parser";

const router = express.Router();

router.post("/stripe-webhook", bodyParser.raw({ type: "application/json" }), postStripeWebhook);

export default router;
