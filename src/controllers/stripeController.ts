import { Request, Response } from "express";
import { cancelSubscription } from "../services/stripe.service";
import { stripe } from "../utils/stripe";
import prisma from "../prismaClient";

export const postCancelSubscription = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    const result = await cancelSubscription(userId);
    res.json(result);
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const postCheckoutSession = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, plan } = req.body;

    if (!userId || !plan) {
      return res.status(400).json({ error: "Missing userId or plan" });
    }

    // Find user
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.fullName,
      });

      customerId = customer.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customerId },
      });
    }

    // Choose subscribe plan
    let priceId = "";
    if (plan === "STANDARD") {
      priceId = process.env.STRIPE_PRICE_STANDARD!;
    } else if (plan === "PREMIUM") {
      priceId = process.env.STRIPE_PRICE_PREMIUM!;
    } else {
      return res.status(400).json({ error: "Invalid plan" });
    }

    if (!priceId) {
      return res.status(500).json({ error: "Missing price configuration" });
    }
    /*   let priceId = "";
    if (user.subscription === "STANDARD") priceId = process.env.STRIPE_PRICE_STANDARD!;
    else if (user.subscription === "PREMIUM") priceId = process.env.STRIPE_PRICE_PREMIUM!;
    else return res.status(400).json({ error: "Invalid plan" }); */

    console.log(priceId);

    // Create checkout session

    // 🟢 CASE 1 — No subscription → Create Checkout
    if (!user.stripeSubscriptionId) {
      const session = await stripe.checkout.sessions.create({
        mode: "subscription",
        payment_method_types: ["card"],
        customer: customerId,
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      });

      return res.json({ url: session.url });
    }

    // 🔵 CASE 2 — Has subscription → Upgrade/Downgrade safely
    const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);

    const currentItem = subscription.items.data[0];

    // 🛑 Prevent duplicate plan selection
    if (currentItem.price.id === priceId) {
      return res.status(400).json({ error: "Already on this plan" });
    }

    await stripe.subscriptions.update(user.stripeSubscriptionId, {
      items: [
        {
          id: currentItem.id,
          price: priceId,
        },
      ],
      proration_behavior: "create_prorations",
    });

    /* const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      customer: customerId,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    });
 */
    return res.json({ success: true });
  } catch (error) {
    console.error("Create Checkout Session error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
