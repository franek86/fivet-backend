import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JwtPayload } from "jsonwebtoken";
import { AuthError, NotFoundError, ValidationError } from "../helpers/error.helpers";
import { sendOtp } from "../helpers/auth.helpers";
import { setCookie } from "../utils/cookies/setCookies";
import prisma from "../prismaClient";
import { generateOtp } from "../helpers/generateOtp.helpers";
import { ForgotPasswordSchema, LoginSchema, RegisterUserSchema, VerifyOtpSchema, VerifyUserSchema } from "../schemas/auth.schema";
import { UserMeResponseSchema } from "../schemas/user.schema";
import { logger } from "../config/logger";

const generateAccessToken = (userId: string, role: string, fullName: string, subscription: string, isActiveSubscription: boolean) => {
  return jwt.sign({ userId, role, fullName, subscription, isActiveSubscription }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
};

const generateRefreshToken = (userId: string, role: string, fullName: string, subscription: string, isActiveSubscription: boolean) => {
  return jwt.sign({ userId, role, fullName, subscription, isActiveSubscription }, process.env.REFRESH_SECRET as string, {
    expiresIn: "7d",
  });
};

/*  REGISTER NEW USER WITH OTP */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = RegisterUserSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.warn("Register validation failed");
      return next(parsed.error.flatten().fieldErrors);
    }

    const { email, fullName } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn("User exists");
      throw new ValidationError("User already exists with this email");
    }

    // generate otp
    const otp = generateOtp(6);
    console.log("Email otp ", email);
    //Save OTP to database
    await prisma.otp.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 60 * 1000), // Expires in 1 minute
      },
    });

    await sendOtp(fullName, email, "user-activation-email", otp);

    logger.info("OTP send");
    res.status(200).json({ message: "OTP send to email. Please verify your account" });
  } catch (error) {
    next(error);
  }
};

/* VERIFY USER WITH OTP */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = VerifyUserSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn("Verfiy user validation failed");
      return next(parsed.error.flatten().fieldErrors);
    }
    const { email, fullName, role, password, otp } = parsed.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      logger.warn("User exists");
      return next(new ValidationError("User already exists!"));
    }

    const recordOtp = await prisma.otp.findUnique({ where: { email } });
    if (!recordOtp) {
      logger.error("OTP not found");
      res.status(400).json({ message: "OTP not found. Request a new one." });
      return;
    }

    if (recordOtp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { email } });

      logger.warn("OTP expired");
      res.status(400).json({ message: "OTP expired. Request a new one." });
      return;
    }

    if (recordOtp.otp !== otp) {
      logger.error("Invalid OTP");
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        role,
      },
    });

    await prisma.otp.delete({
      where: { email },
    });

    const accessToken = generateAccessToken(newUser.id, newUser.role, newUser.fullName, newUser.subscription, newUser.isActiveSubscription);
    const refreshToken = generateRefreshToken(
      newUser.id,
      newUser.role,
      newUser.fullName,
      newUser.subscription,
      newUser.isActiveSubscription,
    );

    setCookie(res, "access_token", accessToken, 5 * 60 * 1000);
    setCookie(res, "refresh_token", refreshToken, 7 * 24 * 60 * 60 * 1000);

    logger.info("User registred");
    res.status(201).json({
      success: true,
      message: "User registred successfully!",
    });
  } catch (error) {
    next(error);
  }
};

/* LOGIN USER WITH ACCESS AND REFRESH TOKEN */
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = LoginSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.warn("Unauthorized request");
      return next(parsed.error.flatten().fieldErrors);
    }

    const { email, password, rememberMe } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.error("User does not exists");
      throw new AuthError("Invalid credentails.");
    }

    const validatePassword = await bcrypt.compare(password, user.password);

    if (!validatePassword) {
      logger.warn("Invalid credentials");
      throw new AuthError("Invalid credentails.");
    }

    const accessToken = generateAccessToken(user.id, user.role, user.fullName, user.subscription, user.isActiveSubscription);
    const refreshToken = generateRefreshToken(user.id, user.role, user.fullName, user.subscription, user.isActiveSubscription);

    /* 
      if is remember me, set token in 30 days other ways set token to 7 days
    */
    const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    //setCookie(res, "access_token", accessToken, 5 * 60 * 1000); //5 minutes
    setCookie(res, "refresh_token", refreshToken, refreshTokenExpiry); // 7 days

    //logger.info("User loggedin");
    res.json({
      message: "User loggedin successfully",
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/* REFRESH TOKEN */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      logger.warn("No refresh token");
      res.status(401).json({ message: "No refresh token provided" });
      return;
    }
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET as string) as JwtPayload;

    if (!decoded || !decoded.userId || !decoded.role) {
      logger.error("Invalid refresh token");
      res.status(401).json({ message: "Invalid refresh token" });
      return;
    }

    const new_access_token = generateAccessToken(
      decoded.userId,
      decoded.role,
      decoded.fullName,
      decoded.subscription,
      decoded.isActiveSubscription,
    );
    //setCookie(res, "access_token", new_access_token, 5 * 60 * 1000);
    logger.info("Acces token success");
    res.json({
      success: true,
      accessToken: new_access_token,
    });
  } catch (error) {
    res.status(401).json({ message: "Invalid refresh token" });
    return;
  }
};

/* AUTHENTICATED USER */
export const userMe = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      logger.error("Unauthorized user");
      throw new ValidationError("Unauthorized");
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        subscription: true,
        verifyPayment: true,
        isActiveSubscription: true,
        isActive: true,
        avatar: true,
      },
    });

    if (!user) {
      logger.error("User not found");
      throw new NotFoundError("User not found");
    }
    const response = {
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      subscription: user.subscription,
      isActive: user.isActive,
      verifyPayment: user.verifyPayment,
      isActiveSubscription: user.isActiveSubscription,
      avatar: user.avatar || "",
    };

    const validatedResponse = UserMeResponseSchema.parse(response);
    logger.info("Validate user");
    return res.status(200).json(validatedResponse);
  } catch (error) {
    next(error);
  }
};

/* LOGOUT AND CLEAR TOKENS */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    res.clearCookie("refresh_token", { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax" });
    res.clearCookie("access_token", { httpOnly: true, secure: isProduction, sameSite: isProduction ? "none" : "lax" });

    logger.info("User logout");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = ForgotPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      logger.warn("Forget password validation failed");
      return next(parsed.error.flatten().fieldErrors);
    }

    const { email } = parsed.data;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.warn("User not found");
      throw new ValidationError("User not found.");
    }

    // Delete expired OTPs for this email first
    await prisma.otp.deleteMany({
      where: {
        email,
        expiresAt: { lt: new Date() },
      },
    });

    // generate otp
    const otp = generateOtp(6);

    //Save OTP to database
    await prisma.otp.create({
      data: {
        email,
        otp,
        expiresAt: new Date(Date.now() + 60 * 1000), // Expires in 1 minute
      },
    });

    await sendOtp(user.fullName, email, "forgot-password-email", otp);

    logger.info("OTP send");
    res.status(200).json({ message: "OTP send to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

/* VERIFY FORGOT PASSWORD OTP*/
export const verifyForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = VerifyOtpSchema.safeParse(req.body);

    if (!parsed.success) {
      logger.warn("Verify forget password validation error");
      return next(parsed.error.flatten().fieldErrors);
    }

    const { email, otp } = parsed.data;

    const recordOtp = await prisma.otp.findUnique({ where: { email } });
    if (!recordOtp) {
      logger.error("OTP not found");
      res.status(400).json({ message: "OTP not found. Request a new one." });
      return;
    }

    if (recordOtp.expiresAt < new Date()) {
      await prisma.otp.delete({ where: { email } });

      logger.warn("OTP expired");
      res.status(400).json({ message: "OTP expired. Request a new one." });
      return;
    }

    if (recordOtp.otp !== otp) {
      logger.error("Invalid OTP");
      res.status(400).json({ message: "Invalid OTP" });
      return;
    }
    logger.info("OTP verified");
    res.status(200).json({ message: "OTP verified. You can reset you password" });
  } catch (error) {
    next(error);
  }
};

/* RESET USER PASSWORD */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      logger.warn("Reset pawwsord validation failed");
      return next(new ValidationError("Email and passwords are required!"));
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      logger.error("User not found");
      return next(new NotFoundError("User not found"));
    }

    //compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      logger.warn("Same password");
      return next(new ValidationError("Password can not be the same as old password"));
    }

    //hash new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password: hashPassword },
    });
    await prisma.otp.deleteMany({ where: { email } });

    logger.info("Password reset");
    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};
