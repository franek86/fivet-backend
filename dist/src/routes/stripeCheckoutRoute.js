"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const handleStripeWebhookController_1 = require("../controllers/handleStripeWebhookController");
const router = express_1.default.Router();
router.post("/session", handleStripeWebhookController_1.createCheckoutSession);
exports.default = router;
