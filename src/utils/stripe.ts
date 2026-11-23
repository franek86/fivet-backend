import { env } from "node:process";
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-10-29.clover",
  typescript: true,
});
export const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export const STRIPE_PLANS = {
  STANDARD: {
    priceId: process.env.STRIPE_PRICE_STANDARD,
    productId: process.env.STRIPE_PRODUCT_STANDARD,
  },
  PREMIUM: {
    priceId: process.env.STRIPE_PRICE_PREMIUM,
    productId: process.env.STRIPE_PRODUCT_PREMIUM,
  },
} as const;
