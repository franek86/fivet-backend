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
        const [totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionCounts] = yield Promise.all([
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
        ]);
        const subscriptionStats = {
            STARTER: 0,
            STANDARD: 0,
            PREMIUM: 0,
        };
        subscriptionCounts.forEach((item) => {
            subscriptionStats[item.subscription] = item._count.subscription;
        });
        res.json({ monthlyStats, totalShips, totalUsers, totalEvents, topShips, lastFiveUsers, subscriptionStats });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getDashboardStatistic = getDashboardStatistic;
