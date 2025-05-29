import { NextFunction, Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";
import { NotFoundError, ValidationError } from "../helpers/errorHandler";

const prisma = new PrismaClient();
const ACCESS_EXPIRES_IN = 60 * 15;
const REFRESH_EXPIRES_IN = 60 * 60 * 5;

const generateAccessToken = (userId: string, role: string) => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET as string, { expiresIn: ACCESS_EXPIRES_IN });
};

const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.REFRESH_SECRET as string, { expiresIn: REFRESH_EXPIRES_IN });
};

/*  REGISTER USER */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  const { email, password, fullName } = req.body;

  try {
    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        profile: { create: { fullName } },
      },
    });
    res.status(200).json({ message: "User registered successfully", user });
  } catch (error) {
    console.log(error as Error);
    res.status(500).json({ error: (error as Error).message });
  }
};

/* LOGIN USER WITH ACCESS AND REFRESH TOKEN */
export const loginUser = async (req: Request, res: Response): Promise<any> => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(400).json({ message: "Invalid credentails" });

    const validatePassword = await bcrypt.compare(password, user.password);
    if (!validatePassword) return res.status(400).json({ message: "Invalid credentails" });

    const access_token = generateAccessToken(user.id, user.role);
    const refresh_token = generateRefreshToken(user.id);
    const expires_at = Math.floor(Date.now() / 1000) + ACCESS_EXPIRES_IN;

    res.cookie("refresh_token", refresh_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" }); // NOTE: In production mode secure must be true
    res.cookie("access_token", access_token, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict" }); // NOTE: In production mode secure must be true

    res.json({
      access_token,
      expires_at,
      expires_in: ACCESS_EXPIRES_IN,
      refresh_token,
      user: { id: user.id, email: user.email, role: user.role },
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
};

/* AUTHENTICATED USER */
export const userMe = async (req: Request, res: Response): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user?.userId as string },
    select: {
      id: true,
      email: true,
      role: true,
      profile: {
        select: {
          id: true,
          fullName: true,
          avatar: true,
          userId: true,
        },
      },
    },
  });

  if (!user || !user.profile) return res.status(500).json({ message: "User not found" });
  const result = {
    id: user.id,
    role: user.role,
    profile: {
      ...user.profile,
      email: user.email,
    },
  };

  res.json(result);
};

/* REFRESH TOKEN */
export const refreshToken = async (req: Request, res: Response): Promise<any> => {
  const { refresh_token } = req.cookies;

  if (!refresh_token) {
    return res.status(401).json({ message: "No refresh token provided" });
  }
  try {
    const decoded = jwt.verify(refresh_token, process.env.REFRESH_SECRET as string) as JwtPayload;
    const new_access_token = generateAccessToken(decoded.userId, decoded.role);
    const new_expires_at = Math.floor(Date.now() / 1000) + ACCESS_EXPIRES_IN;

    return res.json({
      access_token: new_access_token,
      expires_at: new_expires_at,
      expires_in: ACCESS_EXPIRES_IN,
      refresh_token,
    });
  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

/* LOGOUT AND CLEAR TOKENS */
export const logout = async (req: Request, res: Response) => {
  res.clearCookie("refresh_token", { httpOnly: true, secure: false, sameSite: "strict" });
  res.clearCookie("access_token", { httpOnly: true, secure: false, sameSite: "strict" });

  res.json({ message: "Logged out successfully" });
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
    if (isSamePassword) return next(new ValidationError("Password cannot be same"));

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
