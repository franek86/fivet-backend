import express, { Response } from "express";
import rateLimit from "express-rate-limit";
import {
  loginUser,
  logout,
  refreshToken,
  registerUser,
  userMe,
  resetUserPassword,
  verifyUser,
  forgotPassword,
  verifyForgotPassword,
} from "../controllers/authController";
import { authenticateUser } from "../middleware";

const router = express.Router();

// Create a rate limiter for login attempts
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res: Response) => {
    return res.status(429).json({
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
});

router.post("/register", registerUser);
router.post("/verify-user", verifyUser);
router.post("/login", loginRateLimiter, loginUser);
router.get("/me", authenticateUser, userMe);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/verify-forgot-password", verifyForgotPassword);
router.post("/reset-password", resetUserPassword);

export default router;
