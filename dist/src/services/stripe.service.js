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
                const subscriptionId = invoice.subscription;
                let subscriptionType = "STANDARD";
                if (subscriptionId) {
                    const stripeSubscription = yield stripe_1.stripe.subscriptions.retrieve(subscriptionId);
                    const priceId = stripeSubscription.items.data[0].price.id;
                    if (priceId === process.env.STRIPE_PRICE_STANDARD) {
                        subscriptionType = "STANDARD";
                    }
                    else if (priceId === process.env.STRIPE_PRICE_PREMIUM) {
                        subscriptionType = "PREMIUM";
                    }
                }
                // Update user subscription & mark payment verified
                yield prismaClient_1.default.user.update({
                    where: { id: user.id },
                    data: {
                        subscription: subscriptionType,
                        verifyPayment: true,
                        stripeSubscriptionId: invoice.subscription,
                        // TO DO: add isActiveSubsciption to true
                    },
                });
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
            const stripeSubId = subscription.id;
            const user = yield prismaClient_1.default.user.findFirst({ where: { stripeSubscriptionId: stripeSubId } });
            if (!user)
                break;
            yield prismaClient_1.default.user.update({
                where: { id: user.id },
                data: {
                    subscription: "STANDARD",
                    verifyPayment: false,
                    stripeSubscriptionId: null,
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
