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
exports.postCheckoutSession = exports.postCancelSubscription = void 0;
const stripe_service_1 = require("../services/stripe.service");
const stripe_1 = require("../utils/stripe");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const postCancelSubscription = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        const result = yield (0, stripe_service_1.cancelSubscription)(userId);
        res.json(result);
    }
    catch (error) {
        console.error("Cancel subscription error:", error);
        res.status(500).json({ error: error.message });
    }
});
exports.postCancelSubscription = postCancelSubscription;
const postCheckoutSession = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.body;
        if (!userId) {
            return res.status(400).json({ error: "Missing userId" });
        }
        // Find user
        const user = yield prismaClient_1.default.user.findUnique({ where: { id: userId } });
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        // Create stripe customer
        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = yield stripe_1.stripe.customers.create({
                email: user.email,
                name: user.fullName,
            });
            customerId = customer.id;
            yield prismaClient_1.default.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }
        // Choose subscribe plam
        let priceId = "";
        if (user.subscription === "STANDARD")
            priceId = process.env.STRIPE_PRICE_STANDARD;
        else if (user.subscription === "PREMIUM")
            priceId = process.env.STRIPE_PRICE_PREMIUM;
        else
            return res.status(400).json({ error: "Invalid plan" });
        // Create checkout session
        const session = yield stripe_1.stripe.checkout.sessions.create({
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
        return res.json({ url: session.url });
    }
    catch (error) {
        console.error("Create Checkout Session error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
});
exports.postCheckoutSession = postCheckoutSession;
