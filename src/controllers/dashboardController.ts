import { Request, Response } from "express";

import prisma from "../prismaClient";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getTrend(current: number, prev: number) {
  const change = current - prev;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "same";
  return { trend, change: Math.abs(change) };
}

/* 
  STATISTIC DASHBAORD
 
export const getAdminDashboardStatistic = async (req: Request, res: Response): Promise<void> => {
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

    // Calculate trend
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const prev30Days = new Date();
    prev30Days.setDate(last30Days.getDate() - 30);

    // trend ships
    const shipsLast30 = await prisma.ship.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const shipsPrev30 = await prisma.ship.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const shipsTrend = getTrend(shipsLast30, shipsPrev30);

    // Users
    const usersLast30 = await prisma.user.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const usersPrev30 = await prisma.user.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const usersTrend = getTrend(usersLast30, usersPrev30);

    // Events
    const eventsLast30 = await prisma.event.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const eventsPrev30 = await prisma.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const eventsTrend = getTrend(eventsLast30, eventsPrev30);

    res.json({
      monthlyStats,
      totalShips,
      shipsTrend,
      totalUsers,
      usersTrend,
      totalEvents,
      eventsTrend,
      topShips,
      lastFiveUsers,
      subscriptionStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
*/

export const getAdminDashboardStatistic = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(404).json({ message: "User could not found" });
    return;
  }

  try {
    const year = new Date().getFullYear();
    const today = new Date();
    const last30Days = new Date(today);
    last30Days.setDate(today.getDate() - 30);
    const prev30Days = new Date(last30Days);
    prev30Days.setDate(last30Days.getDate() - 30);

    // Single wave — everything fires at once
    const [
      monthlyStats,
      totalShips,
      totalUsers,
      totalEvents,
      topShips,
      lastFiveUsers,
      subscriptionCounts,
      shipsLast30,
      shipsPrev30,
      usersLast30,
      usersPrev30,
      eventsLast30,
      eventsPrev30,
    ] = await Promise.all([
      // Monthly stats — 12 months in parallel internally
      Promise.all(
        Array.from({ length: 12 }).map(async (_, monthIndex) => {
          const start = new Date(year, monthIndex, 1);
          const end = new Date(year, monthIndex + 1, 1);
          const [users, ships] = await Promise.all([
            prisma.user.count({ where: { createdAt: { gte: start, lt: end } } }),
            prisma.ship.count({ where: { createdAt: { gte: start, lt: end } } }),
          ]);
          return { month: monthIndex, users, ships };
        }),
      ),

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
          profile: { select: { avatar: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),

      prisma.user.groupBy({
        by: ["subscription"],
        _count: { subscription: true },
      }),

      // Trend queries in the same wave, not after
      prisma.ship.count({ where: { createdAt: { gte: last30Days, lt: today } } }),
      prisma.ship.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } }),
      prisma.user.count({ where: { createdAt: { gte: last30Days, lt: today } } }),
      prisma.user.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } }),
      prisma.event.count({ where: { createdAt: { gte: last30Days, lt: today } } }),
      prisma.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } }),
    ]);

    const subscriptionStats = { STARTER: 0, STANDARD: 0, PREMIUM: 0 };
    subscriptionCounts.forEach((item) => {
      subscriptionStats[item.subscription] = item._count.subscription;
    });

    res.json({
      monthlyStats,
      totalShips,
      shipsTrend: getTrend(shipsLast30, shipsPrev30),
      totalUsers,
      usersTrend: getTrend(usersLast30, usersPrev30),
      totalEvents,
      eventsTrend: getTrend(eventsLast30, eventsPrev30),
      topShips,
      lastFiveUsers,
      subscriptionStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CURRENT USER STATISTIC */
export const getCurrentUserStats = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;

  if (!userId) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  try {
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const prev30Days = new Date();
    prev30Days.setDate(last30Days.getDate() - 30);

    //Ship trend
    const userShipsLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, userId },
    });
    const userShipsPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, userId },
    });
    const userShipsTrend = getTrend(userShipsLast30, userShipsPrev30);

    /* Published ship trend */
    const userPublishedLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, isPublished: true, userId },
    });
    const userPublishedPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, isPublished: true, userId },
    });
    const userPublishedTrend = getTrend(userPublishedLast30, userPublishedPrev30);

    /* Event trend */
    const eventsLast30 = await prisma.event.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const eventsPrev30 = await prisma.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const eventsTrend = getTrend(eventsLast30, eventsPrev30);

    // Fetch counts in parallel
    const [totalShips, totalPublishedShips, totalEvents, topShips] = await Promise.all([
      prisma.ship.count({ where: { userId } }),
      prisma.ship.count({ where: { userId, isPublished: true } }),
      prisma.event.count({ where: { userId } }),
      prisma.ship.findMany({
        where: { userId },
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
    ]);

    res.json({
      totalShips,
      totalPublishedShips,
      totalEvents,
      userPublishedTrend,
      userShipsTrend,
      eventsTrend,
      topShips,
    });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/*
export const getEarnings = async (_req: Request, res: Response) => {
  try {
    const payments = await prisma.payment.findMany({
      where: { status: "PAID" },
      select: {
        amount: true,
        createdAt: true,
      },
    });

    const weekMap = new Map<string, number>();
    const monthMap = new Map<string, number>();
    const yearMap = new Map<string, number>();

    for (const p of payments) {
      const date = new Date(p.createdAt);

    
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + p.amount);

     
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + p.amount);

     
      const yearKey = `${date.getFullYear()}`;
      yearMap.set(yearKey, (yearMap.get(yearKey) || 0) + p.amount);
    }

    const formatMap = (map: Map<string, number>, type: "week" | "month" | "year") => {
      return Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, value]) => {
          let name = key;

          if (type === "month") {
            const [, m] = key.split("-");
            name = new Date(2024, Number(m) - 1).toLocaleString("en", {
              month: "short",
            });
          }

          if (type === "week") {
            name = key.split("-")[1]; // W1, W2...
          }

          return {
            name,
            v: value,
          };
        });
    };

    res.json({
      earningsData: {
        weeks: formatMap(weekMap, "week"),
        months: formatMap(monthMap, "month"),
        year: formatMap(yearMap, "year"),
      },
    });
  } catch (err) {
    console.error("getEarnings error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
};
*/

export const getEarnings = async (_req: Request, res: Response) => {
  try {
    // Example: only last 12 months
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1);

    const payments = await prisma.payment.findMany({
      where: {
        status: "PAID",
        createdAt: {
          gte: startDate,
        },
      },
      select: {
        amount: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const weekMap: Record<string, number> = {};
    const monthMap: Record<string, number> = {};
    const yearMap: Record<string, number> = {};

    for (let i = 0; i < payments.length; i++) {
      const p = payments[i];

      const d = p.createdAt;

      const year = d.getFullYear();
      const month = d.getMonth();

      // Faster week calculation
      const week = Math.ceil(d.getDate() / 7);

      const weekKey = `${year}-W${week}`;
      const monthKey = `${year}-${month}`;
      const yearKey = `${year}`;

      weekMap[weekKey] = (weekMap[weekKey] || 0) + p.amount;
      monthMap[monthKey] = (monthMap[monthKey] || 0) + p.amount;
      yearMap[yearKey] = (yearMap[yearKey] || 0) + p.amount;
    }

    const weeks = Object.entries(weekMap).map(([key, value]) => ({
      name: key.split("-")[1],
      v: value,
    }));

    const months = Object.entries(monthMap).map(([key, value]) => {
      const [, month] = key.split("-");

      return {
        name: MONTHS[Number(month)],
        v: value,
      };
    });

    const years = Object.entries(yearMap).map(([key, value]) => ({
      name: key,
      v: value,
    }));

    return res.json({
      earningsData: {
        weeks,
        months,
        year: years,
      },
    });
  } catch (err) {
    console.error("getEarnings error:", err);

    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
