import { Socket } from "socket.io";
import prisma from "../prismaClient";
import { getIO } from "./socket.service";

export const registerChatHandlers = (socket: Socket, userId: string) => {
  // ------------------------------------------
  // JOIN CONVERSATION
  // ------------------------------------------

  socket.on("conversation:join", async (conversationId: string) => {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });

      if (!conversation) {
        socket.emit("chat:error", {
          message: "Conversation not found",
        });
        return;
      }

      const isParticipant = conversation.ownerId === userId || conversation.brokerId === userId;

      if (!isParticipant) {
        socket.emit("chat:error", {
          message: "You are not part of this conversation",
        });
        return;
      }

      if (conversation.status !== "ACTIVE") {
        socket.emit("chat:error", {
          message: "Conversation is closed",
        });
        return;
      }

      socket.join(`conversation:${conversationId}`);

      console.log(`[CHAT] User ${userId} joined ${conversationId}`);
    } catch (error) {
      console.error("[CHAT] Join error:", error);

      socket.emit("chat:error", {
        message: "Unable to join conversation",
      });
    }
  });

  // ------------------------------------------
  // LEAVE CONVERSATION
  // ------------------------------------------

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(`conversation:${conversationId}`);

    console.log(`[CHAT] User ${userId} left ${conversationId}`);
  });

  // ------------------------------------------
  // SEND MESSAGE
  // ------------------------------------------

  socket.on("message:send", async ({ conversationId, content }: { conversationId: string; content: string }) => {
    try {
      if (typeof content !== "string" || !content.trim()) {
        socket.emit("chat:error", {
          message: "Message content is required",
        });
        return;
      }

      const conversation = await prisma.conversation.findUnique({
        where: {
          id: conversationId,
        },
      });

      if (!conversation) {
        socket.emit("chat:error", {
          message: "Conversation not found",
        });
        return;
      }

      const isParticipant = conversation.ownerId === userId || conversation.brokerId === userId;

      if (!isParticipant) {
        socket.emit("chat:error", {
          message: "You are not part of this conversation",
        });
        return;
      }

      if (conversation.status !== "ACTIVE") {
        socket.emit("chat:error", {
          message: "Conversation is closed",
        });
        return;
      }

      const [message] = await prisma.$transaction([
        prisma.message.create({
          data: {
            conversationId,
            senderId: userId,
            content: content.trim(),
          },
        }),

        prisma.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            lastMessageAt: new Date(),
          },
        }),
      ]);

      //socket.to(`conversation:${conversationId}`).emit("message:new", message);
      //emit chat socket
      const io = getIO();
      io.to(`conversation:${conversationId}`).emit("message:new", message);
    } catch (error) {
      console.error("[CHAT] Send message error:", error);

      socket.emit("chat:error", {
        message: "Unable to send message",
      });
    }
  });
};
