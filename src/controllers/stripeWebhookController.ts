import { Request, Response } from "express";
import Stripe from "stripe";

import { stripe } from "../utils/stripe";
import prisma from "../prismaClient";
import { NotFoundError, ValidationError } from "../helpers/error.helpers";

const mapStripeSubscriptionStatus = (status: Stripe.Subscription.Status) => {
  switch (status) {
    case "incomplete":
      return "INCOMPLETE";

    case "active":
      return "ACTIVE";

    case "past_due":
      return "PAST_DUE";

    case "canceled":
      return "CANCELED";

    case "unpaid":
      return "UNPAID";

    default:
      return "INCOMPLETE";
  }
};

/* Handle checkout completed */
const handleCheckoutCompleted = async (session: Stripe.Checkout.Session) => {
  const userId = session.metadata?.userId;
  const plan = session.metadata?.plan;

  if (!userId || !plan) {
    throw new ValidationError("Missing userId or plan in checkout session metadata");
  }

  if (!session.subscription) {
    throw new ValidationError("Checkout session does not contain subscription");
  }

  const subscriptionId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  const stripePriceId = subscription.items.data[0]?.price.id;

  if (!stripePriceId) {
    throw new NotFoundError("Stripe price not found");
  }

  const customerId = typeof session.customer === "string" ? session.customer : session.customer?.id;
  if (!customerId) {
    throw new NotFoundError("Stripe customer not found");
  }

  await prisma.user.update({
    where: {
      id: userId,
    },

    data: {
      stripeCustomerId: customerId,
    },
  });

  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },

    update: {
      status: mapStripeSubscriptionStatus(subscription.status),
      stripePriceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    },

    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      plan: plan as any,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripePriceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    },
  });
};

/* Handle subsciption create */
const handleSubscriptionCreated = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.userId;
  const plan = subscription.metadata?.plan;

  if (!userId || !plan) {
    throw new ValidationError("Missing userId or plan from subscription metadata");
  }

  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    throw new ValidationError("Price ID missing");
  }

  const customerId = typeof subscription.customer === "string" ? subscription.customer : subscription.customer.id;

  await prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscription.id,
    },

    update: {
      status: mapStripeSubscriptionStatus(subscription.status),
      stripePriceId: priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    },

    create: {
      userId,
      stripeSubscriptionId: subscription.id,
      stripeCustomerId: customerId,
      plan: plan as any,
      status: mapStripeSubscriptionStatus(subscription.status),
      stripePriceId: priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    },
  });
};

/* Handle subscription update */
const handleSubscriptionUpdated = async (subscription: Stripe.Subscription) => {
  const userId = subscription.metadata?.userId;

  if (!userId) {
    throw new ValidationError("Missing userId from subscription metadata");
  }

  const priceId = subscription.items.data[0]?.price.id;

  if (!priceId) {
    throw new ValidationError("Price ID missing");
  }

  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },

    data: {
      status: mapStripeSubscriptionStatus(subscription.status),
      stripePriceId: priceId,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      currentPeriodStart: new Date(subscription.items.data[0].current_period_start * 1000),
      currentPeriodEnd: new Date(subscription.items.data[0].current_period_end * 1000),
    },
  });
};

/* Handle subscription canceled */
const handleSubscriptionDeleted = async (subscription: Stripe.Subscription) => {
  await prisma.subscription.update({
    where: {
      stripeSubscriptionId: subscription.id,
    },

    data: {
      status: "CANCELED",
    },
  });
};

/* Handle invoice paid */
const handleInvoicePaid = async (invoice: Stripe.Invoice) => {
  const subscriptionValue = invoice.parent?.subscription_details?.subscription;

  const subscriptionId = typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;
  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  if (!subscription) {
    throw new ValidationError(`Subscription ${subscriptionId} not found`);
  }

  await prisma.payment.upsert({
    where: {
      stripeInvoiceId: invoice.id,
    },

    update: {
      status: "PAID",
      paidAt: new Date(),
    },

    create: {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: "PAID",
      paidAt: new Date(),
    },
  });
};

/* Handle paymant faild */
const handleInvoicePaymentFailed = async (invoice: Stripe.Invoice) => {
  const subscriptionValue = invoice.parent?.subscription_details?.subscription;

  const subscriptionId = typeof subscriptionValue === "string" ? subscriptionValue : subscriptionValue?.id;

  if (!subscriptionId) {
    return;
  }

  const subscription = await prisma.subscription.findUnique({
    where: {
      stripeSubscriptionId: subscriptionId,
    },
  });

  if (!subscription) {
    throw new Error(`Subscription ${subscriptionId} not found`);
  }

  await prisma.payment.upsert({
    where: {
      stripeInvoiceId: invoice.id,
    },

    update: {
      status: "FAILED",
    },

    create: {
      userId: subscription.userId,
      subscriptionId: subscription.id,
      stripeInvoiceId: invoice.id,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: "FAILED",
    },
  });
};

/* Stripe webhook */
export const stripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];

  if (!signature) {
    return res.status(400).send("Missing Stripe signature");
  }

  let eventNotification: Stripe.Event;

  try {
    eventNotification = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (error) {
    console.error("Stripe webhook signature verification failed");
    return res.status(400).send("Invalid webhook signature");
  }

  try {
    /* Protetion
     * Stripe cpould send multiple evenets
     */
    const existingEvent = await prisma.stripeEvent.findUnique({
      where: {
        stripeEventId: eventNotification.id,
      },
    });

    if (existingEvent?.processedAt) {
      return res.status(200).json({
        received: true,
      });
    }

    switch (eventNotification.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(eventNotification.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
        await handleSubscriptionCreated(eventNotification.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(eventNotification.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(eventNotification.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(eventNotification.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(eventNotification.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled Stripe event: ${eventNotification.type}`);
    }

    await prisma.stripeEvent.upsert({
      where: {
        stripeEventId: eventNotification.id,
      },

      update: {
        processedAt: new Date(),
      },

      create: {
        stripeEventId: eventNotification.id,
        type: eventNotification.type,
        processedAt: new Date(),
      },
    });

    return res.status(200).json({
      received: true,
    });
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return res.status(500).json({ message: "Webhook processing failed" });
  }
};
