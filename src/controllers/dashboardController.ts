import { Request, Response } from "express";
import { startOfMonth, startOfWeek, startOfYear, format, subDays, startOfDay } from "date-fns";

import prisma from "../prismaClient";

/* 
  STATISTIC DASHBAORD
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

    // Calculate trend
    const today = new Date();
    const last30Days = new Date();
    last30Days.setDate(today.getDate() - 30);

    const prev30Days = new Date();
    prev30Days.setDate(last30Days.getDate() - 30);

    //Helper function to get trend
    const getTrend = (current: number, prev: number) => {
      const change = current - prev;
      const trend = change > 0 ? "up" : change < 0 ? "down" : "same";
      return { trend, change: Math.abs(change) };
    };

    // trend ships
    const shipsLast30 = await prisma.ship.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const shipsPrev30 = await prisma.ship.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const shipsTrend = getTrend(shipsLast30, shipsPrev30);

    // Published ships
    const publishedShipsLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, isPublished: true },
    });
    const publishedShipsPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, isPublished: true },
    });
    const publishedShipsTrend = getTrend(publishedShipsLast30, publishedShipsPrev30);

    // Users
    const usersLast30 = await prisma.user.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const usersPrev30 = await prisma.user.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const usersTrend = getTrend(usersLast30, usersPrev30);

    // Events
    const eventsLast30 = await prisma.event.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const eventsPrev30 = await prisma.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const eventsTrend = getTrend(eventsLast30, eventsPrev30);

    // Authenticated- current user trends
    const userShipsLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, userId },
    });

    const userShipsPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, userId },
    });

    const userShipsTrend = getTrend(userShipsLast30, userShipsPrev30);

    // Published ships by this user
    const userPublishedLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, isPublished: true, userId },
    });

    const userPublishedPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, isPublished: true, userId },
    });

    const userPublishedTrend = getTrend(userPublishedLast30, userPublishedPrev30);

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
          trends: {
            ships: userShipsTrend,
            publishedShips: userPublishedTrend,
          },
        };
      });

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
      userStats,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
  EARNINGS
 */
export const getEarnings = async (req: Request, res: Response) => {
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
};
