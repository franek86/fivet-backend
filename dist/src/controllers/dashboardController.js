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
exports.getDashboardStatistic = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
/*
  SHIP STATISTIC ON DASHBAORD
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
            const percentage = prev > 0 ? Math.round((change / prev) * 100) : 100;
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
