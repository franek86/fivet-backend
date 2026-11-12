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

//Verify user rate limiter
export const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 10,
  message: { message: "Too many attempts. Try again later." },
});

// Create a rate limiter for login attempts
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: true,
  handler: (req, res: Response) => {
    return res.status(429).json({
      message: "Too many login attempts. Please try again after 15 minutes.",
    });
  },
  keyGenerator: (req: any) => req.ip,
});

router.post("/register", authLimiter, registerUser);
router.post("/verify-user", verifyLimiter, verifyUser);
router.post("/login", authLimiter, loginUser);
router.post("/refresh-token", authLimiter, refreshToken);
router.post("/logout", logout);
router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/verify-forgot-password", verifyLimiter, verifyForgotPassword);
router.post("/reset-password", resetUserPassword);
router.get("/me", authenticateUser, userMe);

export default router;
