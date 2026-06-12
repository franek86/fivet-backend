import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { CustomJwtPayload } from "../middleware/verifyToken";
import prisma from "../prismaClient";

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

  // Socket.IO
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.auth.token;
    if (!cookieHeader) return next(new Error("No cookies"));

    try {
      const payload = jwt.verify(cookieHeader, process.env.JWT_SECRET as string) as CustomJwtPayload;
      socket.user = payload;
      console.log(`[SOCKET AUTH] User connected: ${payload.userId} | role: ${payload.role}`);

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.user.userId;
    const role = socket.user.role;

    //Each user joins their own room
    if (userId) {
      socket.join(`user:${userId}`);
    }

    if (role === "ADMIN") {
      socket.join("admin-room");
    }

    // Add socket to user's set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId)!.add(socket.id);

    // Broadcast online users
    if (role === "USER") {
      socket.to("admin-room").emit("user:online", {
        userId,
      });
    }

    // Broadcast updated count
    if (role === "USER") {
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
        if (role === "USER") {
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
