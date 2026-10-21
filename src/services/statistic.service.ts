import {
  DealStatus,
  ListingStatus,
  PaymentStatus,
  PostStatus,
  Role,
  AssignmentStatus,
  BrokerRequestStatus,
  InquiryStatus,
  EventStatus,
} from "@prisma/client";
import prisma from "../prismaClient";

interface UsersByCountry {
  country: string;
  total: number;
  brokers: number;
  owners: number;
  buyers: number;
  admins: number;
}

export type RevenuePeriod = "weekly" | "monthly" | "yearly";

const RECENT_LIMIT = 5;

const verifiedPublishedShipWhere = {
  isPublished: true,
  listingStatus: ListingStatus.VERIFIED,
};

// ADMIN DASHBOARD
export const serviceAdminDashboard = async () => {
  const [
    ships,
    publishedShips,
    pendingShips,
    users,
    activeUsers,
    brokers,
    owners,
    buyers,
    adminEvents,
    blogs,
    publishedBlogs,
    paymentsPaid,
    popularShips,
    recentUsers,
    recentBlogs,
    recentAdminEvents,
  ] = await Promise.all([
    prisma.ship.count(),

    prisma.ship.count({
      where: verifiedPublishedShipWhere,
    }),

    prisma.ship.count({
      where: { listingStatus: ListingStatus.PENDING },
    }),

    prisma.user.count(),

    prisma.user.count({
      where: { isActive: true },
    }),

    prisma.user.count({
      where: { role: Role.BROKER },
    }),

    prisma.user.count({
      where: { role: Role.OWNER },
    }),

    prisma.user.count({
      where: { role: Role.BUYER },
    }),

    prisma.event.count({
      where: {
        user: { role: Role.ADMIN },
      },
    }),

    prisma.post.count(),

    prisma.post.count({
      where: { status: PostStatus.PUBLISHED },
    }),

    prisma.payment.count({
      where: { status: PaymentStatus.PAID },
    }),

    prisma.ship.findMany({
      orderBy: [{ clicks: "desc" }, { createdAt: "desc" }],
      take: RECENT_LIMIT,
      select: {
        id: true,
        shipName: true,
        slug: true,
        imo: true,
        clicks: true,
        price: true,
        currency: true,
        isPublished: true,
      },
    }),

    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        fullName: true,
        email: true,
        role: true,
        country: true,
        createdAt: true,
      },
    }),

    prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        title: true,
        slug: true,
        status: true,
        views: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),

    prisma.event.findMany({
      where: {
        user: { role: Role.ADMIN },
      },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        title: true,
        start: true,
        status: true,
        user: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    }),
  ]);

  return {
    totals: {
      ships,
      publishedShips,
      pendingShips,
      users,
      activeUsers,
      brokers,
      owners,
      buyers,
      adminEvents,
      blogs,
      publishedBlogs,
      paymentsPaid,
    },
    popularShips: popularShips.map((ship) => ({
      ...ship,
      price: Number(ship.price),
      currency: ship.currency ?? "USD",
    })),
    recentUsers,
    recentBlogs,
    recentAdminEvents,
  };
};

// ADMIN WORLD MAP
export const serviceUsersByCountry = async () => {
  const users = await prisma.user.findMany({
    select: {
      country: true,
      role: true,
    },
  });

  const countryMap = new Map<string, UsersByCountry>();

  for (const user of users) {
    const country = user.country?.trim() || "Unknown";

    const current = countryMap.get(country) ?? {
      country,
      total: 0,
      brokers: 0,
      owners: 0,
      buyers: 0,
      admins: 0,
    };

    current.total += 1;

    switch (user.role) {
      case Role.BROKER:
        current.brokers += 1;
        break;
      case Role.OWNER:
        current.owners += 1;
        break;
      case Role.BUYER:
        current.buyers += 1;
        break;
      case Role.ADMIN:
        current.admins += 1;
        break;
    }

    countryMap.set(country, current);
  }

  return [...countryMap.values()].sort((a, b) => b.total - a.total);
};

// ADMIN REVENUE
export const serviceRevenue = async (period: RevenuePeriod) => {
  const now = new Date();
  const start = new Date(now);

  if (period === "weekly") {
    start.setDate(start.getDate() - 6);
    start.setHours(0, 0, 0, 0);
  } else if (period === "monthly") {
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
  } else {
    start.setMonth(0, 1);
    start.setHours(0, 0, 0, 0);
  }

  const payments = await prisma.payment.findMany({
    where: {
      status: PaymentStatus.PAID,
      createdAt: {
        gte: start,
        lte: now,
      },
    },
    select: {
      amount: true,
      currency: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Dont count diffrent currency
  const currencies = new Set(payments.map((payment) => payment.currency.toUpperCase()));

  if (currencies.size > 1) {
    throw new Error("Revenue contains multiple currencies. Filter by currency or convert amounts before aggregation.");
  }

  const currency = currencies.values().next().value ?? "EUR";
  const points = new Map<string, number>();

  if (period === "weekly" || period === "monthly") {
    const cursor = new Date(start);

    while (cursor <= now) {
      const key = dateKey(cursor, "day");
      points.set(key, 0);
      cursor.setDate(cursor.getDate() + 1);
    }
  } else {
    const cursor = new Date(start);

    while (cursor <= now) {
      const key = dateKey(cursor, "month");
      points.set(key, 0);
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  for (const payment of payments) {
    const key = dateKey(payment.createdAt, period === "yearly" ? "month" : "day");

    points.set(key, (points.get(key) ?? 0) + payment.amount);
  }

  const resultPoints = [...points.entries()].map(([date, revenue]) => ({
    date,
    revenue: Number(revenue.toFixed(2)),
    currency,
  }));

  const totalRevenue = resultPoints.reduce((total, point) => total + point.revenue, 0);

  return {
    period,
    currency,
    totalRevenue: Number(totalRevenue.toFixed(2)),
    points: resultPoints,
  };
};

const dateKey = (date: Date, granularity: "day" | "month"): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  if (granularity === "month") {
    return `${year}-${month}`;
  }

  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

// BROKER DASHBOARD
export const serivceBrokerDashboard = async (userId: string) => {
  const [
    ships,
    publishedShips,
    pendingShips,
    acceptedOwners,
    events,
    openInquiries,
    unreadMessages,
    pendingRequests,
    acceptedRequests,
    activeDeals,
    recentShips,
    recentInquiries,
    upcomingEvents,
  ] = await Promise.all([
    prisma.ship.count({
      where: { listedById: userId },
    }),

    prisma.ship.count({
      where: {
        listedById: userId,
        ...verifiedPublishedShipWhere,
      },
    }),

    prisma.ship.count({
      where: {
        listedById: userId,
        listingStatus: ListingStatus.PENDING,
      },
    }),

    prisma.brokerAssignment.count({
      where: {
        brokerId: userId,
        status: AssignmentStatus.ACCEPTED,
      },
    }),

    prisma.event.count({
      where: { userId },
    }),

    prisma.inquiry.count({
      where: {
        recipientId: userId,
        status: InquiryStatus.OPEN,
      },
    }),

    prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: { brokerId: userId },
      },
    }),

    prisma.brokerRequest.count({
      where: {
        brokerId: userId,
        status: BrokerRequestStatus.PENDING,
      },
    }),

    prisma.brokerRequest.count({
      where: {
        brokerId: userId,
        status: BrokerRequestStatus.ACCEPTED,
      },
    }),

    prisma.deal.count({
      where: {
        brokerId: userId,
        status: {
          in: [DealStatus.NEGOTIATING, DealStatus.CONFIRMED, DealStatus.ACTIVE],
        },
      },
    }),

    prisma.ship.findMany({
      where: { listedById: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        shipName: true,
        slug: true,
        clicks: true,
        listingStatus: true,
        isPublished: true,
        createdAt: true,
      },
    }),

    prisma.inquiry.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        ship: {
          select: { id: true, shipName: true },
        },
        sender: {
          select: { id: true, fullName: true },
        },
      },
    }),

    prisma.event.findMany({
      where: {
        userId,
        start: { gte: new Date() },
        status: EventStatus.PLANNED,
      },
      orderBy: { start: "asc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        priority: true,
      },
    }),
  ]);

  return {
    totals: {
      ships,
      publishedShips,
      pendingShips,
      acceptedOwners,
      events,
      openInquiries,
      unreadMessages,
      pendingRequests,
      acceptedRequests,
      activeDeals,
    },
    recentShips,
    recentInquiries,
    upcomingEvents,
  };
};

// OWNER DASHBOARD
export const serivceOwnerDashboard = async (userId: string) => {
  const [
    ships,
    publishedShips,
    pendingShips,
    acceptedBrokers,
    pendingBrokerRequests,
    acceptedBrokerRequests,
    openInquiries,
    unreadMessages,
    negotiatingDeals,
    activeDeals,
    completedDeals,
    events,
    recentShips,
    recentBrokerRequests,
    recentInquiries,
    upcomingEvents,
  ] = await Promise.all([
    prisma.ship.count({
      where: { ownerId: userId },
    }),

    prisma.ship.count({
      where: {
        ownerId: userId,
        ...verifiedPublishedShipWhere,
      },
    }),

    prisma.ship.count({
      where: {
        ownerId: userId,
        listingStatus: ListingStatus.PENDING,
      },
    }),

    prisma.brokerAssignment.count({
      where: {
        ownerId: userId,
        status: AssignmentStatus.ACCEPTED,
      },
    }),

    prisma.brokerRequest.count({
      where: {
        ownerId: userId,
        status: BrokerRequestStatus.PENDING,
      },
    }),

    prisma.brokerRequest.count({
      where: {
        ownerId: userId,
        status: BrokerRequestStatus.ACCEPTED,
      },
    }),

    prisma.inquiry.count({
      where: {
        recipientId: userId,
        status: InquiryStatus.OPEN,
      },
    }),

    prisma.message.count({
      where: {
        isRead: false,
        senderId: { not: userId },
        conversation: { ownerId: userId },
      },
    }),

    prisma.deal.count({
      where: {
        ownerId: userId,
        status: DealStatus.NEGOTIATING,
      },
    }),

    prisma.deal.count({
      where: {
        ownerId: userId,
        status: DealStatus.ACTIVE,
      },
    }),

    prisma.deal.count({
      where: {
        ownerId: userId,
        status: DealStatus.COMPLETED,
      },
    }),

    prisma.event.count({
      where: { userId },
    }),

    prisma.ship.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        shipName: true,
        slug: true,
        clicks: true,
        listingStatus: true,
        isPublished: true,
        createdAt: true,
      },
    }),

    prisma.brokerRequest.findMany({
      where: { ownerId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        status: true,
        message: true,
        createdAt: true,
        broker: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        ship: {
          select: { id: true, shipName: true },
        },
      },
    }),

    prisma.inquiry.findMany({
      where: { recipientId: userId },
      orderBy: { createdAt: "desc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        message: true,
        status: true,
        createdAt: true,
        ship: {
          select: { id: true, shipName: true },
        },
        sender: {
          select: { id: true, fullName: true },
        },
      },
    }),

    prisma.event.findMany({
      where: {
        userId,
        start: { gte: new Date() },
        status: EventStatus.PLANNED,
      },
      orderBy: { start: "asc" },
      take: RECENT_LIMIT,
      select: {
        id: true,
        title: true,
        start: true,
        end: true,
        priority: true,
      },
    }),
  ]);

  return {
    totals: {
      ships,
      publishedShips,
      pendingShips,
      acceptedBrokers,
      pendingBrokerRequests,
      acceptedBrokerRequests,
      openInquiries,
      unreadMessages,
      negotiatingDeals,
      activeDeals,
      completedDeals,
      events,
    },
    recentShips,
    recentBrokerRequests,
    recentInquiries,
    upcomingEvents,
  };
};
