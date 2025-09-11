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
exports.getAllEvents = exports.createEvent = void 0;
const eventSchema_1 = require("../schemas/eventSchema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const pagination_1 = require("../helpers/pagination");
/*
    CREATE EVENT AUTH USER
*/
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = eventSchema_1.eventSchema.parse(req.body);
    try {
        const newEvent = yield prismaClient_1.default.event.create({ data: body });
        return res.status(200).json(newEvent);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.createEvent = createEvent;
/* GET ALL EVENTS WITH PAGINATION, FILTER AND SORT*/
const getAllEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
    const { search } = req.query;
    const whereCondition = {};
    if (search && typeof search === "string" && search.trim().length > 0) {
        whereCondition.OR = [
            {
                title: {
                    contains: search.trim(),
                    mode: "insensitive",
                },
            },
            {
                description: { contains: search.trim(), mode: "insensitive" },
            },
        ];
    }
    try {
        const events = yield prismaClient_1.default.event.findMany({ where: whereCondition, orderBy: { createdAt: "desc" } });
        return res.status(200).json(events);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Error fetching dashboard data." });
    }
});
exports.getAllEvents = getAllEvents;
