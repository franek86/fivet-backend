import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt, { JsonWebTokenError, JwtPayload } from "jsonwebtoken";
import { AuthError, NotFoundError, ValidationError } from "../helpers/error.helpers";
import { checkOtpRestrictions, sendOtp, trackOtpRequest, verifyOtp } from "../helpers/auth.helpers";
import { setCookie } from "../utils/cookies/setCookies";
import prisma from "../prismaClient";

const generateAccessToken = (userId: string, role: string, fullName: string) => {
  return jwt.sign({ userId, role, fullName }, process.env.JWT_SECRET as string, { expiresIn: "5m" });
};

const generateRefreshToken = (userId: string, role: string, fullName: string) => {
  return jwt.sign({ userId, role, fullName }, process.env.REFRESH_SECRET as string, { expiresIn: "7d" });
};

/*  REGISTER NEW USER WITH OTP */
export const registerUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  try {
    const { email, fullName } = req.body;

    if (!emailRegex.test(email)) {
      throw new ValidationError("Invalid email format!");
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) throw new ValidationError("User already exists with this email");

    await checkOtpRestrictions(email, next);
    await trackOtpRequest(email, next);
    await sendOtp(fullName, email, "user-activation-email");

    res.status(200).json({ message: "OTP send to email. Please verify your account" });
  } catch (error) {
    next(error);
  }
};

/* VERIFY USER WITH OTP */
export const verifyUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, fullName, password, otp } = req.body;

    if (!email || !fullName || !password || !otp) return next(new ValidationError("All fields are required!"));

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return next(new ValidationError("User already exists!"));

    await verifyOtp(email, otp, next);

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        fullName,
        profile: {
          create: {
            fullName,
          },
        },
      },
    });
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
    const { email, password, rememberMe } = req.body;
    if (!email || !password) throw new ValidationError("Email and password are required!");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new AuthError("User does not exists.");

    const validatePassword = await bcrypt.compare(password, user.password);
    if (!validatePassword) throw new AuthError("Invalid credentails");

    const accessToken = generateAccessToken(user.id, user.role, user.fullName);
    const refreshToken = generateRefreshToken(user.id, user.role, user.fullName);
    /* 
      if is remember me, set token in 30 days other ways set token to 7 days
    */
    const refreshTokenExpiry = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 7 * 24 * 60 * 60 * 1000;

    setCookie(res, "access_token", accessToken, 5 * 60 * 1000); //5 minutes
    setCookie(res, "refresh_token", refreshToken, refreshTokenExpiry); // 7 days

    res.json({
      message: "User loggedin successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* REFRESH TOKEN */
export const refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { refresh_token } = req.cookies;

    if (!refresh_token) {
      new ValidationError("Unauthorized! No refresh token");
    }
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET as string) as JwtPayload;

    if (!decoded || !decoded.userId || !decoded.role) {
      new JsonWebTokenError("Forbidden! Invalid refresh token.");
    }

    const new_access_token = generateAccessToken(decoded.userId, decoded.role, decoded.fullName);
    setCookie(res, "access_token", new_access_token, 5 * 60 * 1000);

    res.json({
      success: true,
      accessToken: new_access_token,
    });
  } catch (error) {
    next(error);
  }
};

/* AUTHENTICATED USER */
export const userMe = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const authUser = req.user;
    if (!authUser) throw new ValidationError("User not found.");
    const user = await prisma.user.findUnique({
      where: { id: authUser?.userId as string },
      select: {
        id: true,
        email: true,
        role: true,
        profile: {
          select: {
            id: true,
            avatar: true,
            fullName: true,
            userId: true,
          },
        },
      },
    });

    if (!user) return res.status(500).json({ message: "User not found" });
    const result = {
      id: user.id,
      role: user.role,
      profile: {
        ...user.profile,
        email: user.email,
      },
    };

    res.json(result);
  } catch (error) {
    next(error);
  }
};

/* LOGOUT AND CLEAR TOKENS */
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "strict" });
  res.clearCookie("access_token", { httpOnly: true, secure: false, sameSite: "strict" });

  res.json({ message: "Logged out successfully" });
};

/* FORGOT PASSWORD */
export const forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;
    if (!email) throw new ValidationError("Email is required");

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new ValidationError("User not found.");

    await checkOtpRestrictions(email, next);
    await trackOtpRequest(email, next);

    await sendOtp(user.fullName, email, "forgot-password-email");

    res.status(200).json({ message: "OTP send to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

/* VERIFY FORGOT PASSWORD OTP*/
export const verifyForgotPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) throw new ValidationError("Email and OTP are required");

    await verifyOtp(email, otp, next);
    res.status(200).json({ message: "OTP verified. You can reset you password" });
  } catch (error) {
    next(error);
  }
};

/* RESET USER PASSWORD */
export const resetUserPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) return next(new ValidationError("Email and passwords are required!"));

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return next(new NotFoundError("User not found"));

    //compare new password with the existing one
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) return next(new ValidationError("Password can not be the same as old password"));

    //hash new password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { email },
      data: { password: hashPassword },
    });

    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};
