import prisma from "../prismaClient";
import { stripe } from "../utils/stripe";

/* export const createCustomerIfNotExists = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await stripe.customers.create({ email: user.email });

  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId: customer.id },
  });

  return customer.id;
};

export const createSubscription = async (userId: string, plan: "STANDARD" | "PREMIUM") => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const customerId = user.stripeCustomerId || (await createCustomerIfNotExists(userId));

  const priceId = plan === "PREMIUM" ? process.env.STRIPE_PRICE_PREMIUM! : process.env.STRIPE_PRICE_STANDARD!;

  const subscription = await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: "default_incomplete",
    expand: ["latest_invoice.payment_intent"],
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscription: plan,
    },
  });

  const clientSecret = (subscription.latest_invoice as any)?.payment_intent?.client_secret;

  return { clientSecret, subscriptionId: subscription.id };
}; */

export const handleStripeEvent = async (event: any) => {
  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount: (invoice.amount_paid ?? 0) / 100,
            stripePaymentId: invoice.payment_intent || "",
            status: "PAID",
          },
        });
      }
      break;
    }

    case "invoice.payment_failed": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        await prisma.payment.create({
          data: {
            userId: user.id,
            amount: (invoice.amount_due ?? 0) / 100,
            stripePaymentId: invoice.payment_intent as string,
            status: "FAILED",
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;

      await prisma.user.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
          subscription: subscription.status === "active" ? "STANDARD" : "STARTER",
        },
      });
      break;
    }
  }
};

export const cancelSubscription = async (userId: string) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.stripeSubscriptionId) throw new Error("No active subscription found");

  await stripe.subscriptions.cancel(user.stripeSubscriptionId);

  await prisma.user.update({
    where: { id: userId },
    data: {
      stripeSubscriptionId: null,
      subscription: "STARTER",
    },
  });

  return { canceled: true };
};
