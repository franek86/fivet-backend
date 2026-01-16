import { Subscription } from "@prisma/client";
import prisma from "../prismaClient";
import { stripe } from "../utils/stripe";

export const handleStripeEvent = async (event: any) => {
  switch (event.type) {
    case "invoice.payment_succeeded": {
      const invoice = event.data.object;
      const customerId = invoice.customer as string;

      const user = await prisma.user.findFirst({
        where: { stripeCustomerId: customerId },
      });

      if (user) {
        const subscriptionId = invoice.subscription as string | null;
        let subscriptionType: Subscription = "STANDARD";

        if (subscriptionId) {
          const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId);
          const priceId = stripeSubscription.items.data[0].price.id;

          if (priceId === process.env.STRIPE_PRICE_STANDARD) {
            subscriptionType = "STANDARD";
          } else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
            subscriptionType = "PREMIUM";
          }
        }

        // Update user subscription & mark payment verified
        await prisma.user.update({
          where: { id: user.id },
          data: {
            subscription: subscriptionType,
            verifyPayment: true,
            stripeSubscriptionId: invoice.subscription as string,
            isActiveSubscription: true,
          },
        });

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
            stripePaymentId: invoice.payment_intent || "",
            status: "FAILED",
            // TO DO: add isActiveSubsciption to false
          },
        });
      }
      break;
    }

    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const subscription = event.data.object;

      const stripeSubId = subscription.id as string;

      const user = await prisma.user.findFirst({ where: { stripeSubscriptionId: stripeSubId } });
      if (!user) break;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscription: "STANDARD",
          verifyPayment: false,
          stripeSubscriptionId: null,
          isActiveSubscription: false,
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
