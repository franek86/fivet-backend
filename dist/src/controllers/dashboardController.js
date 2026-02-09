"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEarnings = exports.getDashboardStatistic = void 0;
const date_fns_1 = require("date-fns");
const prismaClient_1 = __importDefault(require("../prismaClient"));
/*
  STATISTIC DASHBAORD
 */
const getDashboardStatistic = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(404).json({ message: "User could not found" });
    }
    try {
        const year = new Date().getFullYear();
        const monthlyStats = yield Promise.all(Array.from({ length: 12 }).map((_, monthIndex) => __awaiter(void 0, void 0, void 0, function* () {
            const start = new Date(year, monthIndex, 1);
            const end = new Date(year, monthIndex + 1, 1);
            const [users, ships] = yield Promise.all([
                prismaClient_1.default.user.count({ where: { createdAt: { gte: start, lt: end } } }),
                prismaClient_1.default.ship.count({ where: { createdAt: { gte: start, lt: end } } }),
            ]);
            return {
                month: monthIndex,
                users,
                ships,
            };
        })));
        const [totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionCounts, userShipStats] = yield Promise.all([
            prismaClient_1.default.ship.count(),
            prismaClient_1.default.user.count(),
            prismaClient_1.default.event.count(),
            prismaClient_1.default.ship.findMany({
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
            prismaClient_1.default.user.findMany({
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
            prismaClient_1.default.user.groupBy({
                by: ["subscription"],
                _count: { subscription: true },
            }),
            prismaClient_1.default.user.findMany({
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
        const getTrend = (current, prev) => {
            const change = current - prev;
            const trend = change > 0 ? "up" : change < 0 ? "down" : "same";
            return { trend, change: Math.abs(change) };
        };
        // trend ships
        const shipsLast30 = yield prismaClient_1.default.ship.count({ where: { createdAt: { gte: last30Days, lt: today } } });
        const shipsPrev30 = yield prismaClient_1.default.ship.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
        const shipsTrend = getTrend(shipsLast30, shipsPrev30);
        // Published ships
        const publishedShipsLast30 = yield prismaClient_1.default.ship.count({
            where: { createdAt: { gte: last30Days, lt: today }, isPublished: true },
        });
        const publishedShipsPrev30 = yield prismaClient_1.default.ship.count({
            where: { createdAt: { gte: prev30Days, lt: last30Days }, isPublished: true },
        });
        const publishedShipsTrend = getTrend(publishedShipsLast30, publishedShipsPrev30);
        // Users
        const usersLast30 = yield prismaClient_1.default.user.count({ where: { createdAt: { gte: last30Days, lt: today } } });
        const usersPrev30 = yield prismaClient_1.default.user.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
        const usersTrend = getTrend(usersLast30, usersPrev30);
        // Events
        const eventsLast30 = yield prismaClient_1.default.event.count({ where: { createdAt: { gte: last30Days, lt: today } } });
        const eventsPrev30 = yield prismaClient_1.default.event.count({ where: { createdAt: { gte: prev30Days, lt: last30Days } } });
        const eventsTrend = getTrend(eventsLast30, eventsPrev30);
        // Authenticated- current user trends
        const userShipsLast30 = yield prismaClient_1.default.ship.count({
            where: { createdAt: { gte: last30Days, lt: today }, userId },
        });
        const userShipsPrev30 = yield prismaClient_1.default.ship.count({
            where: { createdAt: { gte: prev30Days, lt: last30Days }, userId },
        });
        const userShipsTrend = getTrend(userShipsLast30, userShipsPrev30);
        // Published ships by this user
        const userPublishedLast30 = yield prismaClient_1.default.ship.count({
            where: { createdAt: { gte: last30Days, lt: today }, isPublished: true, userId },
        });
        const userPublishedPrev30 = yield prismaClient_1.default.ship.count({
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
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getDashboardStatistic = getDashboardStatistic;
/*
  EARNINGS
 */
const getEarnings = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const period = req.query.period;
    const PERIOD_WINDOWS = {
        week: 7,
        month: 30,
        year: 365,
    };
    if (!["month", "week", "year"].includes(period)) {
        return res.status(400).json({ error: "Invalid period. Use month, week, or year." });
    }
    try {
        // Fetch all paid payments
        const payments = yield prismaClient_1.default.payment.findMany({
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
        const grouped = {};
        payments.forEach((p) => {
            let key = "";
            if (period === "month") {
                key = (0, date_fns_1.format)((0, date_fns_1.startOfMonth)(p.createdAt), "yyyy-MM");
            }
            else if (period === "week") {
                key = (0, date_fns_1.format)((0, date_fns_1.startOfWeek)(p.createdAt, { weekStartsOn: 1 }), "yyyy-'W'II"); // ISO week
            }
            else if (period === "year") {
                key = (0, date_fns_1.format)((0, date_fns_1.startOfYear)(p.createdAt), "yyyy");
            }
            if (!grouped[key])
                grouped[key] = {};
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
        const today = (0, date_fns_1.startOfDay)(new Date());
        const currentStart = (0, date_fns_1.subDays)(today, windowDays);
        const previousStart = (0, date_fns_1.subDays)(today, windowDays * 2);
        let currentTotal = 0;
        let previousTotal = 0;
        payments.forEach((p) => {
            const created = p.createdAt;
            if (created >= currentStart) {
                currentTotal += p.amount;
            }
            else if (created >= previousStart && created < currentStart) {
                previousTotal += p.amount;
            }
        });
        let trend = 0;
        if (previousTotal === 0 && currentTotal > 0) {
            trend = 100;
        }
        else if (previousTotal > 0) {
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
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: "Internal server error" });
    }
});
exports.getEarnings = getEarnings;
