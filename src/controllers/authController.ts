import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";

import prisma from "../prismaClient";

import { sendOtp } from "../helpers/auth.helpers";
import { AuthError, NotFoundError, ValidationError } from "../helpers/error.helpers";
import { NotificationType } from "@prisma/client";

import { logger } from "../config/logger";
import { formatDate } from "../helpers/date.helpers";
import { setCookie } from "../utils/cookies/setCookies";
import { sendEmail } from "../utils/sendMail";

import { UserMeResponseSchema } from "../schemas/user.schema";
import {
  ForgotPasswordSchema,
  LoginSchema,
  RegisterUserSchema,
  ResetPasswordSchema,
  VerifyOtpSchema,
  VerifyUserSchema,
} from "../schemas/auth.schema";

import { createOTP, verifyOtp } from "../services/otp.service";

import { sendAdminNotification } from "./notificationController";
import {
  generateAccessToken,
  generatePasswordResetToken,
  generateRefreshToken,
  verifyPasswordResetToken,
  verifyRefreshToken,
} from "../services/token.service";

/* -------------------------------------------------------------------------- */
/* REGISTER */
/* -------------------------------------------------------------------------- */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = RegisterUserSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid registration data."));
    }

    const { email, fullName } = parsedData.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ValidationError("User already exists with this email");
    }

    const otp = await createOTP(email);

    await sendOtp(fullName, email, "user-activation-email", otp);

    logger.info(`Registration OTP sent to ${email}`);

    res.status(200).json({
      message: "OTP send to email. Please verify your account",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY USER */
/* -------------------------------------------------------------------------- */
export const verifyUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = VerifyUserSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid verification data."));
    }
    const { email, fullName, role, password, city, country, address, zipCode, companyName, companyRegistrationNumber, otp } =
      parsedData.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ValidationError("User already exists.");
    }

    await verifyOtp(email, otp);

    /* const recordOtp = await prisma.otp.findUnique({ where: { email } });
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
    } */

    //Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: {
          name: companyName || "",
          vat: companyRegistrationNumber,
          city,
          country,
        },
      });

      const user = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          fullName,
          role,
          companyId: company.id,
          city,
          country,
          address,
          zipCode,
        },
      });

      if (role === "BROKER") {
        await tx.brokerProfile.create({
          data: { userId: user.id, verificationStatus: "PENDING" },
        });
      }

      if (role === "OWNER") {
        await tx.ownerProfile.create({
          data: { userId: user.id, verificationStatus: "PENDING" },
        });
      }

      return user;
    });

    /* await prisma.otp.delete({
      where: { email },
    }); */

    const accessToken = generateAccessToken({
      id: newUser.id,
      role: newUser.role,
      fullName: newUser.fullName,
      subscription: newUser.subscription,
      isActiveSubscription: newUser.isActiveSubscription,
    });

    const refreshToken = generateRefreshToken(
      newUser.id,
      /*  newUser.role,
      newUser.fullName,
      newUser.subscription,
      newUser.isActiveSubscription, */
    );

    setCookie(res, "access_token", accessToken, 5 * 60 * 1000);
    setCookie(res, "refresh_token", refreshToken, 7 * 24 * 60 * 60 * 1000);

    /* 
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
      },
    });

    const userLink = `${process.env.FRONTEND_URL}/admin/users/${newUser?.id}`;
    const emailData = {
      userName: newUser.fullName,
      role: newUser.role,
      createdAt: formatDate(newUser.createdAt.toISOString()),
      reviewUrl: userLink,
    };
    const emailToSend = admin?.email ?? "";

   
    if (role !== "ADMIN" && admin) {
      
      await sendAdminNotification(admin.id, `New user created: ${newUser.fullName}`, NotificationType.INFO);
      await sendEmail(emailToSend, "New User created", "user-notification-email", emailData);
    } */

    await notifyAdminAboutNewUser(newUser);

    logger.info(`User registered successfully: ${newUser.id}`);

    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* LOGIN */
/* -------------------------------------------------------------------------- */
export const loginUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = LoginSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid login credentials."));
    }

    const { email, password, rememberMe } = parsedData.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new AuthError("Invalid credentails.");
    }

    const validatePassword = await bcrypt.compare(password, user.password);

    if (!validatePassword) {
      throw new AuthError("Invalid credentails.");
    }

    /*  if (!user.isActive) {
      throw new AuthError("Your account is inactive.");
    } */

    await prisma.user.update({
      where: { id: user.id },
      data: {
        lastLogin: new Date(),
      },
    });

    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      subscription: user.subscription,
      isActiveSubscription: user.isActiveSubscription,
    });

    const refreshExpiration = rememberMe ? "30d" : "7d";

    const refreshToken = generateRefreshToken(user.id, refreshExpiration);

    setCookie(res, "access_token", accessToken, 5 * 60 * 1000);
    setCookie(res, "refresh_token", refreshToken, rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000);

    res.json({
      message: "User loggedin successfully",
      accessToken,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* REFRESH TOKEN */
/* -------------------------------------------------------------------------- */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.cookies.refresh_token;

    if (!token) {
      throw new AuthError("No refresh token provided.");
    }
    const decoded = verifyRefreshToken(token);

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user || !user.isActive) {
      throw new AuthError("Invalid refresh token.");
    }

    const accessToken = generateAccessToken({
      id: user.id,
      role: user.role,
      fullName: user.fullName,
      subscription: user.subscription,
      isActiveSubscription: user.isActiveSubscription,
    });

    setCookie(res, "access_token", accessToken, 5 * 60 * 1000);

    res.json({
      success: true,
      accessToken: accessToken,
    });
  } catch (error) {
    next(new AuthError("Invalid or expired refresh token."));
  }
};

/* -------------------------------------------------------------------------- */
/* CURRENT USER */
/* -------------------------------------------------------------------------- */
export const userMe = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AuthError("Unauthorized.");
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
        company: true,
        brokerProfile: true,
        ownerProfile: true,
      },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
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
      company: user.company || "",
      brokerProfile: {
        verificationStatus: user.brokerProfile?.verificationStatus || "PENDING",
      },
      ownerProfile: {
        verificationStatus: user.ownerProfile?.verificationStatus || "PENDING",
      },
    };

    const validatedResponse = UserMeResponseSchema.parse(response);

    return res.status(200).json(validatedResponse);
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* LOGOUT */
/* -------------------------------------------------------------------------- */
export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";

    const cookiesOption = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
    };

    res.clearCookie("access_token", cookiesOption);
    res.clearCookie("refresh_token", cookiesOption);

    res.json({ message: "Logged out successfully" });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* FORGET PASSWORD */
/* -------------------------------------------------------------------------- */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = ForgotPasswordSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid email address."));
    }

    const { email } = parsedData.data;

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      throw new ValidationError("User not found.");
    }

    // generate otp
    const otp = await createOTP(email);
    await sendOtp(user.fullName, email, "forgot-password-email", otp);

    res.status(200).json({ message: "OTP send to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* VERIFY PASSWORD RESET OTP */
/* -------------------------------------------------------------------------- */
export const verifyForgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = VerifyOtpSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid OTP data."));
    }

    const { email, otp } = parsedData.data;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    /*  const recordOtp = await prisma.otp.findUnique({ where: { email } });
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
    } */

    await verifyOtp(email, otp);

    const resetToken = generatePasswordResetToken(user.id);

    res.status(200).json({ message: "OTP verified. You can reset you password", resetToken });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* RESET PASSWORD */
/* -------------------------------------------------------------------------- */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsedData = ResetPasswordSchema.safeParse(req.body);

    if (!parsedData.success) {
      return next(new ValidationError("Invalid password reset data."));
    }

    const { resetToken, newPassword } = parsedData.data;

    const decoded = verifyPasswordResetToken(resetToken);
    if (decoded.purpose !== "password-reset") {
      throw new AuthError("Invalid password reset token.");
    }

    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) {
      throw new NotFoundError("User not found.");
    }

    //compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);

    if (isSamePassword) {
      throw new ValidationError("New password cannot be the same as the old password.");
    }

    //hash new password
    const hashPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashPassword },
    });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};

/* -------------------------------------------------------------------------- */
/* NOTIFY ADMIN */
/* -------------------------------------------------------------------------- */
/**
 * Notify admin about new register user
 */
const notifyAdminAboutNewUser = async (user: { id: string; fullName: string; role: string; createdAt: Date }): Promise<void> => {
  if (user.role === "ADMIN") {
    return;
  }

  const admin = await prisma.user.findFirst({
    where: {
      role: "ADMIN",
    },
    select: {
      id: true,
      email: true,
    },
  });

  if (!admin) {
    return;
  }

  const reviewUrl = `${process.env.FRONTEND_URL}/admin/users/${user.id}`;
  await sendAdminNotification(admin.id, `New user created: ${user.fullName}`, NotificationType.INFO);

  await sendEmail(admin.email, "New User created", "user-notification-email", {
    userName: user.fullName,
    role: user.role,
    createdAt: formatDate(user.createdAt.toISOString()),
    reviewUrl,
  });
};
