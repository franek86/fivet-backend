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
exports.deleteEvent = exports.updateEventById = exports.getSingleEvent = exports.getAllEvents = exports.createEvent = void 0;
const eventSchema_1 = require("../schemas/eventSchema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
const pagination_1 = require("../helpers/pagination");
const errorHandler_1 = require("../helpers/errorHandler");
/*  CREATE EVENT AUTH USER */
const createEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const body = eventSchema_1.eventSchema.parse(req.body);
    try {
        const newEvent = yield prismaClient_1.default.event.create({ data: body });
        return res.status(200).json(newEvent);
    }
    catch (error) {
        console.log(error);
        next();
    }
});
exports.createEvent = createEvent;
/* GET ALL EVENTS WITH PAGINATION AND FILTER */
const getAllEvents = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedEventData = eventSchema_1.filterEventSchema.safeParse(req.query);
    if (!parsedEventData.success) {
        return res.status(400).json({ errors: parsedEventData.error.errors });
    }
    const { pageNumber, pageSize, skip } = (0, pagination_1.getPaginationParams)(req.query);
    const { search, status, priority, startDate, endDate } = parsedEventData.data;
    const where = {};
    if (status)
        where.status = status;
    if (priority)
        where.priority = priority;
    if (startDate && endDate) {
        where.AND = [{ start: { lte: endDate } }, { end: { gte: startDate } }];
    }
    else if (startDate) {
        where.end = { gte: startDate };
    }
    else if (endDate) {
        where.start = { lte: endDate };
    }
    if (search) {
        where.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
    }
    try {
        const events = yield prismaClient_1.default.event.findMany({
            where,
            skip,
            take: pageSize,
            orderBy: { createdAt: "desc" },
        });
        const total = yield prismaClient_1.default.event.count({ where });
        return res.status(200).json({ events, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
    }
    catch (error) {
        console.log(error);
        next();
    }
});
exports.getAllEvents = getAllEvents;
/* SINGLE EVENT */
const getSingleEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        return res.status(400).json({ message: "Id could not found" });
    try {
        const findEvent = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!findEvent)
            return res.status(400).json({ message: "Event could not found" });
        return res.status(200).json(findEvent);
    }
    catch (error) {
        console.log(error);
        next();
    }
});
exports.getSingleEvent = getSingleEvent;
/* UPDATE EVENT BY ID */
const updateEventById = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        throw new errorHandler_1.ValidationError("Event ID does not exists.");
    const parsedData = eventSchema_1.eventSchema.safeParse(req.body);
    if (!parsedData.success) {
        return res.status(400).json({ errors: parsedData.error.errors });
    }
    try {
        const eventId = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!eventId)
            return res.status(404).json({ message: "Event is required" });
        const updateEvent = yield prismaClient_1.default.event.update({
            where: { id },
            data: parsedData.data,
        });
        return res.status(200).json(updateEvent);
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateEventById = updateEventById;
/* DELETE EVENT BY ID  */
const deleteEvent = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id)
        throw new errorHandler_1.ValidationError("ID does not exists.");
    try {
        const findEventById = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!findEventById)
            throw new errorHandler_1.ValidationError("Event not found.");
        yield prismaClient_1.default.event.delete({
            where: { id },
        });
        return res.status(200).json({
            message: `Event by ${id} deleted successfully`,
        });
    }
    catch (error) {
        console.log(error);
        next(error);
    }
});
exports.deleteEvent = deleteEvent;
