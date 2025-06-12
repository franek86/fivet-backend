import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload {
  userId: string;
  role: string;
}

const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  const token = req.cookies.access_token;
  if (!token) return res.status(401).json({ message: "Unauthorized" });
  const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  req.user = decoded;

  next();
};

export default authAdmin;
