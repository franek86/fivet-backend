import type { Request, Response, NextFunction } from "express";
import { AuthError } from "../helpers/error.helpers";

import {
  RevenuePeriod,
  serivceBrokerDashboard,
  serivceOwnerDashboard,
  serviceAdminDashboard,
  serviceRevenue,
  serviceUsersByCountry,
} from "../services/statistic.service";

export const revenuePeriods = ["weekly", "monthly", "yearly"];

export const getAdminDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await serviceAdminDashboard();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getRevenue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const period = req.query.period ?? "monthly";

    if (typeof period !== "string" || !revenuePeriods.includes(period)) {
      res.status(400).json({
        success: false,
        message: "Invalid period. Use weekly, monthly or yearly.",
      });
      return;
    }

    const data = await serviceRevenue(period as RevenuePeriod);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getUsersByCountry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await serviceUsersByCountry();

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getBrokerDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AuthError("Unauthorized");
    }

    const data = await serivceBrokerDashboard(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const getOwnerDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AuthError("Unauthorized");
    }

    const data = await serivceOwnerDashboard(userId);

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};
