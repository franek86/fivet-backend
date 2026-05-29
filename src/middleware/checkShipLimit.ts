import { Request, Response, NextFunction } from "express";
import { canUserCreateShip } from "../controllers/shipController";

const checkShipsLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const check = await canUserCreateShip(userId);

    if (!check.allowed) {
      return res.status(403).json({
        error: "Ship limit reached",
        message: check.reason,
        shipsUsed: check.shipsUsed,
        shipLimit: check.shipLimit,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default checkShipsLimit;
