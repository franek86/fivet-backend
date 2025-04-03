"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authController_1 = require("../controllers/authController");
const middleware_1 = require("../middleware");
const router = express_1.default.Router();
// Create a rate limiter for login attempts
const loginRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: "Too many login attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});
router.post("/register", authController_1.registerUser);
router.post("/login", loginRateLimiter, authController_1.loginUser);
router.get("/me", middleware_1.authenticateUser, authController_1.userMe);
router.post("/refresh-token", middleware_1.authenticateUser, authController_1.refreshToken);
router.post("/logout", authController_1.logout);
exports.default = router;
