import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { v2 as cloudinary } from "cloudinary";

import prisma from "../prismaClient";
import { logger } from "../config/logger";
import { sendOtp } from "../helpers/auth.helpers";
import { AuthError, NotFoundError, ValidationError } from "../helpers/error.helpers";
import { createOTP, verifyOtp } from "../services/otp.service";
import { uploadSingleFile } from "../services/cloundinary.service";

import { ChangePasswordSchema, ConfirmEmailChangeSchema, FreezeAccountSchema, RequestEmailChangeSchema } from "../schemas/settings.schema";
import { buffer } from "stream/consumers";

const getCurrentUser = async (req: Request) => {
  const userId = req.user?.userId;
  if (!userId) throw new AuthError("Unauthorized.");

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new NotFoundError("User not found.");
  return user;
};

/* CHANGE PASSWORD */
export const changePassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ChangePasswordSchema.safeParse(req.body);
    if (!parsed.success) return next(new ValidationError("Invalid password data."));

    const { currentPassword, newPassword } = parsed.data;
    const user = await getCurrentUser(req);

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AuthError("Current password is incorrect.");

    if (await bcrypt.compare(newPassword, user.password)) {
      throw new ValidationError("New password cannot be the same as the old password.");
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

    res.status(200).json({ message: "Password changed successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CHANGE EMAIL - step 1: send OTP to the new address */
export const requestEmailChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = RequestEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) return next(new ValidationError("Invalid email data."));

    const { email, password } = parsed.data;
    const user = await getCurrentUser(req);

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AuthError("Password is incorrect.");

    const taken = await prisma.user.findUnique({ where: { email } });
    if (taken) throw new ValidationError("Email is already in use.");

    const otp = await createOTP(email);
    await sendOtp(user.fullName, email, "user-activation-email", otp);

    res.status(200).json({ message: "OTP sent to the new email address." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CHANGE EMAIL - step 2: verify OTP and switch */
export const confirmEmailChange = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = ConfirmEmailChangeSchema.safeParse(req.body);
    if (!parsed.success) return next(new ValidationError("Invalid verification data."));

    const { email, otp } = parsed.data;
    const user = await getCurrentUser(req);

    await verifyOtp(email, otp);

    const taken = await prisma.user.findUnique({ where: { email: email } });
    if (taken) throw new ValidationError("Email is already in use.");

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { email },
      select: { id: true, email: true },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CHANGE AVATAR */
export const changeAvatar = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) throw new ValidationError("Image is required.");
    const user = await getCurrentUser(req);

    const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream({ folder: "avatars" }, (err, r) => (err || !r ? reject(err) : resolve(r as any)))
        .end(req.file!.buffer);
    });

    if (user.avatarPublicId) {
      await cloudinary.uploader.destroy(user.avatarPublicId).catch((e) => logger.warn(e));
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { avatar: result.secure_url, avatarPublicId: result.public_id },
      select: { id: true, avatar: true },
    });

    res.status(200).json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* FREEZE ACCOUNT */
export const freezeAccount = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const parsed = FreezeAccountSchema.safeParse(req.body);
    if (!parsed.success) return next(new ValidationError("Password is required."));

    const user = await getCurrentUser(req);

    const valid = await bcrypt.compare(parsed.data.password, user.password);
    if (!valid) throw new AuthError("Password is incorrect.");

    await prisma.user.update({
      where: { id: user.id },
      data: { isFrozen: true, frozenAt: new Date() },
    });

    const isProduction = process.env.NODE_ENV === "production";
    const cookiesOption = {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? ("none" as const) : ("lax" as const),
    };
    res.clearCookie("access_token", cookiesOption);
    res.clearCookie("refresh_token", cookiesOption);

    res.status(200).json({ message: "Account frozen. Log in again to restore it." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
