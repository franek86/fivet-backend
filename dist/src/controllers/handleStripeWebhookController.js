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
Object.defineProperty(exports, "__esModule", { value: true });
exports.postStripeWebhook = void 0;
const stripe_1 = require("../utils/stripe");
const stripe_service_1 = require("../services/stripe.service");
const postStripeWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const sig = req.headers["stripe-signature"];
    const rawBody = req["body"];
    let event;
    try {
        event = stripe_1.stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
    }
    catch (err) {
        console.error("Webhook signature verification failed:", err.message);
        res.status(400).send(`Webhook Error: ${err.message}`);
    }
    try {
        yield (0, stripe_service_1.handleStripeEvent)(event);
        res.json({ received: true });
    }
    catch (err) {
        console.error("Webhook handler failed:", err);
        res.status(500).send("Internal Server Error");
    }
});
exports.postStripeWebhook = postStripeWebhook;
