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
    const cookieHeader = socket.handshake.headers.cookie;
    if (!cookieHeader) return next(new Error("No cookies"));

    try {
      const token = cookieHeader
        .split("; ")
        .find((c) => c.startsWith("access_token="))
        ?.split("=")[1];

      if (!token) return next(new Error("No auth token"));
      const payload = jwt.verify(token, process.env.JWT_SECRET as string) as CustomJwtPayload;
      socket.user = payload;
      console.log(`[SOCKET AUTH] User connected: ${payload.userId} | role: ${payload.role}`);

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", async (socket: Socket) => {
    const { userId, role } = socket.user;

    if (role === "ADMIN") {
      socket.join("admins");
    }

    // Add socket to user's set
    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }
    onlineUsers.get(userId)!.add(socket.id);

    if (onlineUsers.get(userId)!.size === 1) {
      await prisma.user.update({
        where: { id: userId },
        data: { isActive: true },
      });
    }

    // Broadcast online users
    emitOnlineUsersToAdmins();

    socket.on("disconnect", async () => {
      // Remove socket
      const userSockets = onlineUsers.get(userId);

      if (!userSockets) return;

      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(userId);

        await prisma.user.update({
          where: { id: userId },
          data: { isActive: false },
        });

        emitOnlineUsersToAdmins();
      }
    });

    socket.on("logout", async () => {
      const userSockets = onlineUsers.get(socket.user.userId);
      if (!userSockets) return;

      userSockets.delete(socket.id);

      if (userSockets.size === 0) {
        onlineUsers.delete(socket.user.userId);

        await prisma.user.update({
          where: { id: socket.user.userId },
          data: { isActive: false },
        });

        emitOnlineUsersToAdmins();
      }
    });
  });
};

async function emitOnlineUsersToAdmins() {
  const onlineUserIds = Array.from(onlineUsers.keys());

  const users = await prisma.user.findMany({
    where: { id: { in: onlineUserIds } },
  });

  io.to("admins").emit("online-users", { users, count: onlineUsers.size });
}
