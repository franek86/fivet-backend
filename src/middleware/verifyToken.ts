import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

declare module "express-serve-static-core" {
  interface Request {
    user?: JwtPayload;
  }
}

export interface CustomJwtPayload {
  userId: string;
  role: string;
  fullName: string;
  subscription: string;
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies.access_token;
  if (!token) res.status(401).json({ message: "Unauthorized" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
    if (!decoded) res.status(401).json({ message: "Unauthorized! Invalid token" });

    req.user = decoded;

    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized. Token expired or invalid." });
  }
};

export default authenticateUser;
