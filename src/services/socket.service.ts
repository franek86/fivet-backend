import http from "http";
import { Server, Socket } from "socket.io";

let io: Server;

export const initializeSocket = async (server: http.Server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      credentials: true,
      methods: ["GET", "POST"],
    },
  });

  io.on("connection", async (socket: Socket) => {
    console.log("New socket user:", socket.id);

    socket.on("admins", () => {
      socket.join("admins");
      console.log(`Socket ${socket.id} joined admins room`);
    });
    socket.on("disconnect", () => {
      console.log("Socket disconnected:", socket.id);
    });
  });
};

export { io };
