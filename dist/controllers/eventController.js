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
const event_schema_1 = require("../schemas/event.schema");
const prismaClient_1 = __importDefault(require("../prismaClient"));
/*  CREATE EVENT AUTH USER */
const createEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(401).json({ message: "Unauthorized" });
        return;
    }
    try {
        const validate = event_schema_1.CreateEventSchema.parse(req.body);
        const newEvent = yield prismaClient_1.default.event.create({ data: Object.assign(Object.assign({}, validate), { userId: userId }) });
        res.status(201).json(newEvent);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.createEvent = createEvent;
/* GET ALL EVENTS WITH PAGINATION AND FILTER */
const getAllEvents = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const parsedEventData = event_schema_1.FilterEventSchema.safeParse(req.query);
    if (!parsedEventData.success) {
        res.status(400).json({ errors: parsedEventData.error.errors });
        return;
    }
    //const { pageNumber, pageSize, skip } = getPaginationParams(req.query);
    const { pageNumber, pageSize, status, priority, startDate, endDate, search } = parsedEventData.data;
    const skip = (pageNumber - 1) * pageSize;
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
        res.status(200).json({ events, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getAllEvents = getAllEvents;
/* SINGLE EVENT */
const getSingleEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(400).json({ message: "Event ID is required" });
        return;
    }
    try {
        const findEvent = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!findEvent) {
            res.status(404).json({ message: "Event could not found" });
            return;
        }
        res.status(200).json(findEvent);
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.getSingleEvent = getSingleEvent;
/* UPDATE EVENT BY ID */
const updateEventById = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { id } = req.params;
    if (!id)
        res.status(404).json({ message: "Event ID does not exists." });
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
    if (!userId) {
        res.status(404).json({ message: "Unauthorized" });
        return;
    }
    const parsedData = event_schema_1.EditEventSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ errors: parsedData.error.errors });
        return;
    }
    const updatedData = parsedData.data;
    try {
        const eventId = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!eventId) {
            res.status(404).json({ message: "Event is required" });
            return;
        }
        const updateEvent = yield prismaClient_1.default.event.update({
            where: { id },
            data: Object.assign(Object.assign({}, updatedData), { userId: userId }),
        });
        res.status(200).json(updateEvent);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.updateEventById = updateEventById;
/* DELETE EVENT BY ID  */
const deleteEvent = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    if (!id) {
        res.status(401).json({ message: "Event id are required" });
        return;
    }
    try {
        const findEventById = yield prismaClient_1.default.event.findUnique({ where: { id } });
        if (!findEventById) {
            res.status(404).json({ message: "Event not found" });
            return;
        }
        yield prismaClient_1.default.event.delete({
            where: { id },
        });
        res.status(200).json({
            message: `Event by ${id} deleted successfully`,
        });
    }
    catch (error) {
        res.status(500).json({ message: "Internal server error" });
    }
});
exports.deleteEvent = deleteEvent;
