import http from "http";
import { Server, Socket } from "socket.io";

let io: Server;
const users = new Map<string, string>();

export const initializeSocket = async (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket: Socket) => {
    socket.on("joinUser", (userId: string) => {
      users.set(userId, socket.id);
    });

    socket.on("disconnect", () => {
      for (const [userId, socketId] of users.entries()) {
        if (socketId === socket.id) {
          users.delete(userId);
          console.log(`User ${userId} disconnected`);
          break;
        }
      }
    });
  });
};

export { io, users };
