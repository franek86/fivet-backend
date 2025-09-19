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
        const totalShips = yield prismaClient_1.default.ship.count();
        const totalUsers = yield prismaClient_1.default.user.count();
        const totalEvents = yield prismaClient_1.default.event.count();
        const topShips = yield prismaClient_1.default.ship.findMany({
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
        });
        return res.json({ totalShips, totalUsers, totalEvents, topShips });
    }
    catch (error) {
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.getDashboardStatistic = getDashboardStatistic;
