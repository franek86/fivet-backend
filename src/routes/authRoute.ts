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
import { authenticateUser } from "../middleware/verifyToken";

const router = express.Router();

// Create a rate limiter for login attempts
export const authLimiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 5, standardHeaders: true });

router.post("/register", registerUser);
router.post("/verify-user", verifyUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-forgot-password", authLimiter, verifyForgotPassword);
router.post("/reset-password", resetUserPassword);
router.get("/me", authenticateUser, userMe);

export default router;
