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
exports.initializeSocket = exports.onlineUsers = void 0;
const socket_io_1 = require("socket.io");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prismaClient_1 = __importDefault(require("../prismaClient"));
exports.onlineUsers = new Map();
let io;
const initializeSocket = (server) => {
    io = new socket_io_1.Server(server, {
        cors: {
            origin: [process.env.FRONTEND_URL || "", process.env.WEB_URL || ""],
            credentials: true,
        },
    });
    // Socket.IO
    io.use((socket, next) => {
        var _a;
        const cookieHeader = socket.handshake.headers.cookie;
        if (!cookieHeader)
            return next(new Error("No cookies"));
        try {
            const token = (_a = cookieHeader
                .split("; ")
                .find((c) => c.startsWith("access_token="))) === null || _a === void 0 ? void 0 : _a.split("=")[1];
            if (!token)
                return next(new Error("No auth token"));
            const payload = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
            socket.user = payload;
            console.log(`[SOCKET AUTH] User connected: ${payload.userId} | role: ${payload.role}`);
            next();
        }
        catch (err) {
            next(new Error("Unauthorized"));
        }
    });
    io.on("connection", (socket) => __awaiter(void 0, void 0, void 0, function* () {
        const { userId, role } = socket.user;
        if (role === "ADMIN") {
            socket.join("admins");
        }
        // Add socket to user's set
        if (!exports.onlineUsers.has(userId)) {
            exports.onlineUsers.set(userId, new Set());
        }
        exports.onlineUsers.get(userId).add(socket.id);
        if (exports.onlineUsers.get(userId).size === 1) {
            yield prismaClient_1.default.user.update({
                where: { id: userId },
                data: { isActive: true },
            });
        }
        // Broadcast online users
        emitOnlineUsersToAdmins();
        socket.on("disconnect", () => __awaiter(void 0, void 0, void 0, function* () {
            // Remove socket
            const userSockets = exports.onlineUsers.get(userId);
            if (!userSockets)
                return;
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                exports.onlineUsers.delete(userId);
                yield prismaClient_1.default.user.update({
                    where: { id: userId },
                    data: { isActive: false },
                });
                emitOnlineUsersToAdmins();
            }
        }));
        socket.on("logout", () => __awaiter(void 0, void 0, void 0, function* () {
            const userSockets = exports.onlineUsers.get(socket.user.userId);
            if (!userSockets)
                return;
            userSockets.delete(socket.id);
            if (userSockets.size === 0) {
                exports.onlineUsers.delete(socket.user.userId);
                yield prismaClient_1.default.user.update({
                    where: { id: socket.user.userId },
                    data: { isActive: false },
                });
                emitOnlineUsersToAdmins();
            }
        }));
    }));
};
exports.initializeSocket = initializeSocket;
function emitOnlineUsersToAdmins() {
    return __awaiter(this, void 0, void 0, function* () {
        const onlineUserIds = Array.from(exports.onlineUsers.keys());
        const users = yield prismaClient_1.default.user.findMany({
            where: { id: { in: onlineUserIds } },
        });
        io.to("admins").emit("online-users", { users, count: exports.onlineUsers.size });
    });
}
