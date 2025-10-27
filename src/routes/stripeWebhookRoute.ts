import express from "express";
import { handleStripeWebhook } from "../controllers/handleStripeWebhookController";
import bodyParser from "body-parser";
const router = express.Router();

router.post("/stripe", bodyParser.raw({ type: "application/json" }), handleStripeWebhook);

export default router;
