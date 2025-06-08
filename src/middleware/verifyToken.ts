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
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const token = req.cookies.access_token || req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ message: "Unauthorized" });

    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
    if (!decoded) return res.status(401).json({ message: "Unauthorized! Invalid token" });

    req.user = decoded;
    /* const account = await prisma.user.findUnique({ where: { id: decoded.userId } });

    req.user = account;

    if (!account) return res.status(401).json({ message: "Account not found" }); */

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized. Token expired or invalid." });
  }
};

export default authenticateUser;
