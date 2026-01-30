import { Request, Response } from "express";

import prisma from "../prismaClient";

/* 
  SHIP STATISTIC ON DASHBAORD
 */
export const getDashboardStatistic = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(404).json({ message: "User could not found" });
  }
  try {
    const year = new Date().getFullYear();

    const monthlyStats = await Promise.all(
      Array.from({ length: 12 }).map(async (_, monthIndex) => {
        const start = new Date(year, monthIndex, 1);
        const end = new Date(year, monthIndex + 1, 1);

        const [users, ships] = await Promise.all([
          prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
          prisma.ship.count({ where: { createdAt: { gte: start, lt: end } } }),
        ]);
        return {
          month: monthIndex,
          users,
          ships,
        };
      }),
    );

    const [totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionCounts, userShipStats] = await Promise.all([
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
      prisma.user.findMany({
        select: {
          id: true,
          fullName: true,
          ships: {
            select: { id: true, isPublished: true },
          },
          events: true,
        },
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

    // Compute ships stats per user
    const userStats = userShipStats
      .filter((user) => user.id === userId)
      .map((user) => {
        const totalShips = user.ships.length;
        const publishedShips = user.ships.filter((s) => s.isPublished).length;
        const totalEvents = user.events.length;
        return {
          id: user.id,
          fullName: user.fullName,
          totalShips,
          publishedShips,
          totalEvents,
        };
      });

    res.json({ monthlyStats, totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionStats, userStats });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
