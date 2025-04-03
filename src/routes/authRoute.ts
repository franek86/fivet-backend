import express from "express";
import rateLimit from "express-rate-limit";
import { loginUser, logout, refreshToken, registerUser, userMe } from "../controllers/authController";
import { authenticateUser } from "../middleware";

const router = express.Router();

// Create a rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: "Too many login attempts, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerUser);
router.post("/login", loginRateLimiter, loginUser);
router.get("/me", authenticateUser, userMe);
router.post("/refresh-token", authenticateUser, refreshToken);
router.post("/logout", logout);

export default router;
