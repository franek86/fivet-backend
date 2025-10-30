import { Router } from "express";
import { postCancelSubscription, postCheckoutSession } from "../controllers/stripeController";

const router = Router();

router.post("/cancel-subscription", postCancelSubscription);
router.post("/create-checkout-session", postCheckoutSession);

export default router;
