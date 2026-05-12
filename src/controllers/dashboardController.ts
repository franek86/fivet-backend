import { Request, Response } from "express";
import { startOfMonth, startOfWeek, startOfYear, format, subDays, startOfDay } from "date-fns";

import prisma from "../prismaClient";

export function getTrend(current: number, prev: number) {
  const change = current - prev;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "same";
  return { trend, change: Math.abs(change) };
}

/* 
  STATISTIC DASHBAORD
 */
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
  EARNINGS
 */
/* export const getEarningsOld = async (req: Request, res: Response) => {
  const period = req.query.period as string;

  const PERIOD_WINDOWS: Record<string, number> = {
    week: 7,
    month: 30,
    year: 365,
  };

  if (!["month", "week", "year"].includes(period)) {
    return res.status(400).json({ error: "Invalid period. Use month, week, or year." });
  }

  try {
    // Fetch all paid payments
    const payments = await prisma.payment.findMany({
      where: { status: "PAID" },
      select: {
        amount: true,
        createdAt: true,
        user: {
          select: {
            subscription: true,
          },
        },
      },
    });

    // Group and sum by period
    const grouped: Record<string, Record<string, number>> = {};

    payments.forEach((p) => {
      let key = "";

      if (period === "month") {
        key = format(startOfMonth(p.createdAt), "yyyy-MM");
      } else if (period === "week") {
        key = format(startOfWeek(p.createdAt, { weekStartsOn: 1 }), "yyyy-'W'II"); // ISO week
      } else if (period === "year") {
        key = format(startOfYear(p.createdAt), "yyyy");
      }

      if (!grouped[key]) grouped[key] = {};
      if (!grouped[key][p.user.subscription]) {
        grouped[key][p.user.subscription] = 0;
      }

      grouped[key][p.user.subscription] += p.amount;
    });

    // Convert to array for response
    const data = Object.entries(grouped).map(([label, subscriptions]) => ({
      label,
      subscriptions,
    }));

    //Trend
    const windowDays = PERIOD_WINDOWS[period];
    const today = startOfDay(new Date());

    const currentStart = subDays(today, windowDays);
    const previousStart = subDays(today, windowDays * 2);

    let currentTotal = 0;
    let previousTotal = 0;

    payments.forEach((p) => {
      const created = p.createdAt;

      if (created >= currentStart) {
        currentTotal += p.amount;
      } else if (created >= previousStart && created < currentStart) {
        previousTotal += p.amount;
      }
    });

    let trend = 0;
    if (previousTotal === 0 && currentTotal > 0) {
      trend = 100;
    } else if (previousTotal > 0) {
      trend = ((currentTotal - previousTotal) / previousTotal) * 100;
    }

    trend = Number(trend.toFixed(2));

    res.json({
      period,
      data,
      trend: {
        windowDays,
        value: trend,
        currentTotal,
        previousTotal,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
}; */

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

      // ---------------- WEEK ----------------
      const weekKey = `${date.getFullYear()}-W${Math.ceil((date.getDate() + 6 - date.getDay()) / 7)}`;
      weekMap.set(weekKey, (weekMap.get(weekKey) || 0) + p.amount);

      // ---------------- MONTH ----------------
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + p.amount);

      // ---------------- YEAR ----------------
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
