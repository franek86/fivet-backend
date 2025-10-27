import { Request, Response } from "express";

import prisma from "../prismaClient";

/* 
  SHIP STATISTIC ON DASHBAORD
 */
export const getDashboardStatistic = async (req: Request, res: Response): Promise<void> => {
  try {
    const totalShips = await prisma.ship.count();
    const totalUsers = await prisma.user.count();
    const totalEvents = await prisma.event.count();
    const topShips = await prisma.ship.findMany({
      orderBy: { clicks: "desc" },
      take: 5,
      select: {
        id: true,
        shipName: true,
        imo: true,
        clicks: true,
        price: true,
        mainImage: true,
      },
    });
    res.json({ totalShips, totalUsers, totalEvents, topShips });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
