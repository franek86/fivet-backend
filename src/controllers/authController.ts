import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";
import jwt, { JwtPayload } from "jsonwebtoken";

const prisma = new PrismaClient();
const ACCESS_EXPIRES_IN = 60;
const REFRESH_EXPIRES_IN = 60 * 2;

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
    select: { id: true, email: true, profile: true },
  });

  if (!user) return res.status(500).json({ message: "User not found" });

  res.json({ user });
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
