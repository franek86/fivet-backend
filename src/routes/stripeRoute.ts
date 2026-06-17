import { Router } from "express";
import { getPaymentSession, postCancelSubscription, postCheckoutSession } from "../controllers/stripeController";

const router = Router();

router.post("/cancel-subscription", postCancelSubscription);
router.post("/create-checkout-session", postCheckoutSession);
router.get("/get-session", getPaymentSession);

export default router;
