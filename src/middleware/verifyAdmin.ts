import { Request, Response, NextFunction } from "express";

export interface CustomJwtPayload {
  userId: string;
  role: string;
}

const authAdmin = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  console.log(req.user);
  if (!req.user || req.user.role !== "ADMIN") {
    return res.status(403).json({ message: "Access denied. Admins only." });
  }
  next();
};

export default authAdmin;
