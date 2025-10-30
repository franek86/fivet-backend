import { Request, Response } from "express";
import { stripe } from "../utils/stripe";
import { handleStripeEvent } from "../services/stripe.service";

export const postStripeWebhook = async (req: Request, res: Response): Promise<void> => {
  const sig = req.headers["stripe-signature"];
  const rawBody = req["body"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    await handleStripeEvent(event);
    res.json({ received: true });
  } catch (err: any) {
    console.error("Webhook handler failed:", err);
    res.status(500).send("Internal Server Error");
  }
};
