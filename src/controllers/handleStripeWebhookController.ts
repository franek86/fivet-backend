import { Request, Response } from "express";
import Stripe from "stripe";
import prisma from "../prismaClient";
import { PaymentStatus, Subscription } from "@prisma/client";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-09-30.clover",
  typescript: true,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const handleStripeWebhook = async (req: Request, res: Response): Promise<any> => {
  const sig = req.headers["stripe-signature"];

  let event: Stripe.Event;

  try {
    const body = req.body;
    event = stripe.webhooks.constructEvent(body, sig!, endpointSecret);
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      // When user finish checkout session
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const custumerId = session.customer as string;
        const email = session.customer_details?.email;

        if (!email) {
          console.error("Email not found in session");
          break;
        }

        // Find user by email
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
          console.error("User not found for email:", email);
          break;
        }

        //Save custumer id if exists
        if (!user.stripeCustomerId) {
          await prisma.user.update({
            where: { id: user.id },
            data: { stripeCustomerId: custumerId },
          });
        }

        const lineItems = (session as any).line_items?.data || [];
        for (const item of lineItems) {
          const priceId = item.price?.id;
          const isSubscription = item.price?.type === "recurring";

          if (!isSubscription) continue;

          await prisma.user.update({
            where: { id: user.id },
            data: { subscription: Subscription.STANDARD },
          });

          // Save payment

          await prisma.payment.create({
            data: {
              userId: user.id,
              status: PaymentStatus.PAID,
              amout: item.price?.unit_amount ? item.price.unit_amount / 100 : 0,
              currency: item.price?.currency?.toUpperCase() || "EUR",
              sripePaymentId: session.payment_intent as string,
            },
          });
        }
        break;
      }

      // When user cancelled subscription
      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;

        // Find user stripeSubscriptionId or stripeCustomerId
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: subscription.customer as string },
        });
        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: { subscription: Subscription.STARTER },
          });
        } else {
          console.error("User not found for subscription deletion event.");
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    console.log("Raw event data:", JSON.stringify(event.data.object, null, 2));
    return res.status(200).json({ received: true });
  } catch (error: any) {
    console.error("Error handling webhook:", error);
    res.status(500).json({ error: error.message });
  }
};
