"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const stripeController_1 = require("../controllers/stripeController");
const router = (0, express_1.Router)();
router.post("/cancel-subscription", stripeController_1.postCancelSubscription);
router.post("/create-checkout-session", stripeController_1.postCheckoutSession);
exports.default = router;
