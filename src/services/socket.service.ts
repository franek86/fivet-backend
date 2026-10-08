import http from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";

import { CustomJwtPayload } from "../middleware/verifyToken";
import { registerChatHandlers } from "./chat.socket.service";
import { AuthError, NotFoundError } from "../helpers/error.helpers";

declare module "socket.io" {
  interface Socket {
    user: CustomJwtPayload;
  }
}
export let io: Server;

/**
 * Online users
 * A user can have multiple connections
 * Example: userId -> Set(socketId1, socketId2)
 */
export const onlineUsers = new Map<string, Set<string>>();

/**
 *
 * HELPERS
 */
const getOnlineUserIds = (): string[] => {
  return Array.from(onlineUsers.keys());
};

const addOnlineUser = (userId: string, socketId: string): boolean => {
  let sockets = onlineUsers.get(userId);

  const wasOffline = !sockets;

  if (!sockets) {
    sockets = new Set<string>();
    onlineUsers.set(userId, sockets);
  }

  sockets.add(socketId);

  return wasOffline;
};

const removeOnlineUser = (userId: string, socketId: string): boolean => {
  const sockets = onlineUsers.get(userId);

  if (!sockets) {
    return false;
  }

  sockets.delete(socketId);

  if (sockets.size === 0) {
    onlineUsers.delete(userId);
    return true;
  }

  return false;
};

/* -------------------------------------------------------------------------- */
/* Initialize Socket.IO   */
/* -------------------------------------------------------------------------- */
export const initializeSocket = (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: [process.env.FRONTEND_URL || "", process.env.WEB_URL || ""],
      credentials: true,
    },
  });

  /* -------------------------------------------------------------------------- */
  /* Socket authentication  */
  /* -------------------------------------------------------------------------- */
  io.use((socket, next) => {
    const cookieHeader = socket.handshake.auth.token;
    if (!cookieHeader) {
      return next(new NotFoundError("No cookies"));
    }

    try {
      const payload = jwt.verify(cookieHeader, process.env.JWT_SECRET as string) as CustomJwtPayload;

      socket.user = payload;

      next();
    } catch (err) {
      next(new AuthError("Unauthorized"));
    }
  });

  /* -------------------------------------------------------------------------- */
  /* CONNECTION */
  /* -------------------------------------------------------------------------- */
  io.on("connection", (socket: Socket) => {
    const { userId, role } = socket.user;

    if (!userId) {
      socket.disconnect();
      return;
    }

    // User room
    socket.join(`user:${userId}`);

    // Admin room
    if (role === "ADMIN") {
      socket.join("admin-room");
    }

    // Track oline user
    const wasOffline = addOnlineUser(userId, socket.id);

    // send user
    socket.emit("users:online", {
      userId: getOnlineUserIds(),
    });

    //Only emit user:online when this is the user's first connection.
    if (wasOffline) {
      socket.broadcast.emit("user:online", {
        userId,
      });
    }

    // Admin online count
    io.to("admin-room").emit("user:count", {
      count: onlineUsers.size,
    });

    // Chat handlers
    registerChatHandlers(socket, userId);

    // Disconnect socket
    socket.on("disconnect", () => {
      const wentOffline = removeOnlineUser(userId, socket.id);

      if (wentOffline) {
        socket.broadcast.emit("user:offline", {
          userId,
        });
      }

      io.to("admin-room").emit("user:count", {
        count: onlineUsers.size,
      });
    });
  });
};

export const getIO = (): Server => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};
