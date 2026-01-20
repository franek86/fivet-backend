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
exports.deleteNotification = exports.updateUnreadNotification = exports.getUnreadNotification = exports.getNotifications = exports.sendNotification = void 0;
const prismaClient_1 = __importDefault(require("../prismaClient"));
const notification_schema_1 = require("../schemas/notification.schema");
const sendNotification = (userId, message, type) => __awaiter(void 0, void 0, void 0, function* () {
    const notification = yield prismaClient_1.default.notification.create({
        data: {
            userId,
            message,
            type,
        },
    });
    return notification;
});
exports.sendNotification = sendNotification;
const getNotifications = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const response = yield prismaClient_1.default.notification.findMany({
            where: { userId: (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId },
            orderBy: { createdAt: "desc" },
        });
        res.status(200).json(response);
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
exports.getNotifications = getNotifications;
const getUnreadNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const notifications = yield prismaClient_1.default.notification.findMany({
            where: { userId: req.user.userId, isRead: false },
            orderBy: { createdAt: "desc" },
            take: 3,
        });
        const unreadCount = notifications.filter((n) => !n.isRead).length;
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
exports.getUnreadNotification = getUnreadNotification;
const updateUnreadNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const parsedData = notification_schema_1.UpdateNotificationSchema.safeParse(req.body);
    if (!parsedData.success) {
        res.status(400).json({ errors: parsedData.error.errors });
        return;
    }
    const { isRead } = parsedData.data;
    try {
        const updated = yield prismaClient_1.default.notification.update({
            where: { id: Number(id) },
            data: { isRead },
        });
        res.json({ message: "Notification marked as read", notification: updated });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
exports.updateUnreadNotification = updateUnreadNotification;
const deleteNotification = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.params;
    const notificationId = Number(id);
    if (!notificationId) {
        res.status(401).json({ message: "Notification ID are required" });
        return;
    }
    try {
        const notification = yield prismaClient_1.default.notification.findUnique({ where: { id: notificationId } });
        if (!notification) {
            res.status(404).json({ message: "Notification ID not found" });
            return;
        }
        yield prismaClient_1.default.notification.delete({
            where: { id: notificationId },
        });
        res.status(200).json({
            message: `Notification by ${id} deleted successfully`,
        });
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
exports.deleteNotification = deleteNotification;
