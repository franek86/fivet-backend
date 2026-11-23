import prisma from "../prismaClient";
import { stripe, STRIPE_PLANS } from "../utils/stripe";

import { CreateCheckoutInput } from "../schemas/stripe.schema";
import { ValidationError } from "../helpers/error.helpers";

/* Create stripe checkout session */
export const createCheckoutSession = async (userId: string, input: CreateCheckoutInput) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ValidationError("User not found");

  const plan = STRIPE_PLANS[input.plan];

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price: plan.priceId,
        quantity: 1,
      },
    ],

    success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email,
    client_reference_id: userId,
    metadata: {
      userId,
      plan: input.plan,
    },

    subscription_data: {
      metadata: {
        userId,
        plan: input.plan,
      },
    },
  });

  return {
    checkoutUrl: session.url,
  };
};
