import { Request, Response } from "express";
import prisma from "../prismaClient";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function getTrend(current: number, prev: number) {
  const change = current - prev;
  const trend = change > 0 ? "up" : change < 0 ? "down" : "same";
  return { trend, change: Math.abs(change) };
}

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
      where: { createdAt: { gte: last30Days, lt: today }, listedById: userId },
    });
    const userShipsPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, listedById: userId },
    });
    const userShipsTrend = getTrend(userShipsLast30, userShipsPrev30);

    /* Published ship trend */
    const userPublishedLast30 = await prisma.ship.count({
      where: { createdAt: { gte: last30Days, lt: today }, isPublished: true, listedById: userId },
    });
    const userPublishedPrev30 = await prisma.ship.count({
      where: { createdAt: { gte: prev30Days, lt: last30Days }, isPublished: true, listedById: userId },
    });
    const userPublishedTrend = getTrend(userPublishedLast30, userPublishedPrev30);

    /* Event trend */
    const eventsLast30 = await prisma.event.count({ where: { createdAt: { gte: last30Days, lt: today } } });
    const eventsPrev30 = await prisma.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
    const eventsTrend = getTrend(eventsLast30, eventsPrev30);

    // Fetch counts in parallel
    const [totalShips, totalPublishedShips, totalEvents, topShips] = await Promise.all([
      prisma.ship.count({ where: { listedById: userId } }),
      prisma.ship.count({ where: { listedById: userId, isPublished: true } }),
      prisma.event.count({ where: { userId } }),
      prisma.ship.findMany({
        where: { listedById: userId },
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

/* TOTAL ADMIN EARNINGS */
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
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};
