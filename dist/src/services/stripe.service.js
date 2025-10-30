"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.cancelSubscription = exports.handleStripeEvent = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const stripe_1 = require("../utils/stripe");
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
const handleStripeEvent = (event) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    switch (event.type) {
        case "invoice.payment_succeeded": {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const user = yield prismaClient_1.default.user.findFirst({
                where: { stripeCustomerId: customerId },
            });
            if (user) {
                yield prismaClient_1.default.payment.create({
                    data: {
                        userId: user.id,
                        amount: ((_a = invoice.amount_paid) !== null && _a !== void 0 ? _a : 0) / 100,
                        stripePaymentId: invoice.payment_intent || "",
                        status: "PAID",
                    },
                });
            }
            break;
        }
        case "invoice.payment_failed": {
            const invoice = event.data.object;
            const customerId = invoice.customer;
            const user = yield prismaClient_1.default.user.findFirst({
                where: { stripeCustomerId: customerId },
            });
            if (user) {
                yield prismaClient_1.default.payment.create({
                    data: {
                        userId: user.id,
                        amount: ((_b = invoice.amount_due) !== null && _b !== void 0 ? _b : 0) / 100,
                        stripePaymentId: invoice.payment_intent,
                        status: "FAILED",
                    },
                });
            }
            break;
        }
        case "customer.subscription.updated":
        case "customer.subscription.deleted": {
            const subscription = event.data.object;
            yield prismaClient_1.default.user.updateMany({
                where: { stripeSubscriptionId: subscription.id },
                data: {
                    subscription: subscription.status === "active" ? "STANDARD" : "STARTER",
                },
            });
            break;
        }
    }
});
exports.handleStripeEvent = handleStripeEvent;
const cancelSubscription = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const user = yield prismaClient_1.default.user.findUnique({ where: { id: userId } });
    if (!(user === null || user === void 0 ? void 0 : user.stripeSubscriptionId))
        throw new Error("No active subscription found");
    yield stripe_1.stripe.subscriptions.cancel(user.stripeSubscriptionId);
    yield prismaClient_1.default.user.update({
        where: { id: userId },
        data: {
            stripeSubscriptionId: null,
            subscription: "STARTER",
        },
    });
    return { canceled: true };
});
exports.cancelSubscription = cancelSubscription;
