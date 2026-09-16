import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { registerChatHandlers } from "./chat.socket.service";

declare module "socket.io" {
  interface Socket {
    user: CustomJwtPayload;
  }
}

export const onlineUsers = new Map<string, Set<string>>();

let io: Server;

export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "", process.env.WEB_URL || ""],
      credentials: true,
    },
  });

  // ------------------------------------------
  // SOCKET AUTHENTICATION
  // ------------------------------------------

  io.use((socket, next) => {
    const cookieHeader = socket.handshake.auth.token;
    if (!cookieHeader) return next(new Error("No cookies"));

    try {
      const payload = jwt.verify(cookieHeader, process.env.JWT_SECRET as string) as CustomJwtPayload;
      socket.user = payload;
      //console.log(`[SOCKET AUTH] User connected: ${payload.userId} | role: ${payload.role}`);

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  // ------------------------------------------
  // CONNECTION
  // ------------------------------------------

  io.on("connection", async (socket: Socket) => {
    const userId = socket.user.userId;
    const role = socket.user.role;

    // User room
    if (role !== "ADMIN" && userId) {
      socket.join(`user:${userId}`);
    }

    // Admin room
    if (role === "ADMIN") {
      socket.join("admin-room");
    }

    // Online users
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId)!.add(socket.id);

    //Chat handlers
    if (userId) {
      registerChatHandlers(socket, userId);
    }

    // Admin receives online event
    if (role === "ADMIN") {
      socket.to("admin-room").emit("user:online", {
        userId,
      });
      socket.to("admin-room").emit("user:count", {
        count: onlineUsers.size,
      });
    }

    socket.on("disconnect", () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;

      sockets.delete(socket.id);

      const isOffline = sockets.size === 0;

      if (isOffline) {
        onlineUsers.delete(userId);
        if (role === "BUYER") {
          socket.to("admin-room").emit("user:offline", {
            userId,
          });
        }
      }

      socket.to("admin-room").emit("user:count", {
        count: onlineUsers.size,
      });
    });
  });
};

export const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized");
  return io;
};
