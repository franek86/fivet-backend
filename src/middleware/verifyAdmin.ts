import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

export interface CustomJwtPayload {
  userId: string;
  role: string;
  fullName: string;
}

const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  let token: string | undefined;
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  if (!token && req.cookies?.access_token) {
    token = req.cookies.access_token;
  }

  if (!token) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  /*  if (!req.user || req.user.role !== "ADMIN") {
    res.status(403).json({ message: "Access denied. Admins only." });
  }
 */
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
    if (!decoded) {
      res.status(401).json({ message: "Unauthorized! Invalid token" });
      return;
    }
    req.user = decoded;

    if (req.user.role !== "ADMIN") {
      res.status(403).json({ message: "Access denied. Admins only." });
      return;
    }
    next();
  } catch (error) {
    res.status(401).json({ message: "Unauthorized. Token expired or invalid." });
  }
};

export default authAdmin;
