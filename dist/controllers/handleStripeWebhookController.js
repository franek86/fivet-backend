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
exports.handleStripeWebhook = void 0;
const stripe_1 = __importDefault(require("stripe"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
const client_1 = require("@prisma/client");
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-09-30.clover",
    typescript: true,
});
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const handleStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d, _e, _f, _g;
    const sig = req.headers["stripe-signature"];
    let event;
    try {
        const body = req.body;
        event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        switch (event.type) {
            // When user finish checkout session
            case "checkout.session.completed": {
                const session = event.data.object;
                const custumerId = session.customer;
                const email = (_a = session.customer_details) === null || _a === void 0 ? void 0 : _a.email;
                if (!email) {
                    console.error("Email not found in session");
                    break;
                }
                // Find user by email
                const user = yield prismaClient_1.default.user.findUnique({ where: { email } });
                if (!user) {
                    console.error("User not found for email:", email);
                    break;
                }
                //Save custumer id if exists
                if (!user.stripeCustomerId) {
                    yield prismaClient_1.default.user.update({
                        where: { id: user.id },
                        data: { stripeCustomerId: custumerId },
                    });
                }
                const lineItems = ((_b = session.line_items) === null || _b === void 0 ? void 0 : _b.data) || [];
                for (const item of lineItems) {
                    const priceId = (_c = item.price) === null || _c === void 0 ? void 0 : _c.id;
                    const isSubscription = ((_d = item.price) === null || _d === void 0 ? void 0 : _d.type) === "recurring";
                    if (!isSubscription)
                        continue;
                    yield prismaClient_1.default.user.update({
                        where: { id: user.id },
                        data: { subscription: client_1.Subscription.STANDARD },
                    });
                    // Save payment
                    yield prismaClient_1.default.payment.create({
                        data: {
                            userId: user.id,
                            status: client_1.PaymentStatus.PAID,
                            amout: ((_e = item.price) === null || _e === void 0 ? void 0 : _e.unit_amount) ? item.price.unit_amount / 100 : 0,
                            currency: ((_g = (_f = item.price) === null || _f === void 0 ? void 0 : _f.currency) === null || _g === void 0 ? void 0 : _g.toUpperCase()) || "EUR",
                            sripePaymentId: session.payment_intent,
                        },
                    });
                }
                break;
            }
            // When user cancelled subscription
            case "customer.subscription.deleted": {
                const subscription = event.data.object;
                // Find user stripeSubscriptionId or stripeCustomerId
                const user = yield prismaClient_1.default.user.findFirst({
                    where: { stripeCustomerId: subscription.customer },
                });
                if (user) {
                    yield prismaClient_1.default.user.update({
                        where: { id: user.id },
                        data: { subscription: client_1.Subscription.STARTER },
                    });
                }
                else {
                    console.error("User not found for subscription deletion event.");
                }
                break;
            }
            default:
                console.log(`Unhandled event type: ${event.type}`);
        }
        console.log("Raw event data:", JSON.stringify(event.data.object, null, 2));
        return res.status(200).json({ received: true });
    }
    catch (error) {
        console.error("Error handling webhook:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.handleStripeWebhook = handleStripeWebhook;
