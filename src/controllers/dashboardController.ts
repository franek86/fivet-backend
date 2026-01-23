import { Request, Response } from "express";

import prisma from "../prismaClient";

/* 
  SHIP STATISTIC ON DASHBAORD
 */
export const getDashboardStatistic = async (req: Request, res: Response): Promise<void> => {
  try {
    const [totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionCounts] = await Promise.all([
      prisma.ship.count(),
      prisma.user.count(),
      prisma.event.count(),
      prisma.ship.findMany({
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
      }),
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          subscription: true,
          lastLogin: true,
          createdAt: true,
          profile: {
            select: {
              avatar: true,
            },
          },
        },

        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.user.groupBy({
        by: ["subscription"],
        _count: { subscription: true },
      }),
    ]);

    const subscriptionStats = {
      STARTER: 0,
      STANDARD: 0,
      PREMIUM: 0,
    };

    subscriptionCounts.forEach((item) => {
      subscriptionStats[item.subscription] = item._count.subscription;
    });

    res.json({ totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionStats });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
