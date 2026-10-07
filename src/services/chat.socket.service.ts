import { Socket } from "socket.io";
import { getIO } from "./socket.service";

import prisma from "../prismaClient";

import { logger } from "../config/logger";

import { ConversationIdSchema, SendMessageSchema } from "../schemas/chat.schema";

const getConversationRoom = (conversationId: string) => `conversation:${conversationId}`;
const getUserRoom = (userId: string) => `user:${userId}`;

//Helpers
const getUserConversation = async (conversationId: string, userId: string) => {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, ownerId: true, brokerId: true, status: true },
  });
  if (!conversation) {
    return null;
  }
  const isParticipant = conversation.ownerId === userId || conversation.brokerId === userId;
  if (!isParticipant) {
    return null;
  }
  return conversation;
};

//Chat error
const emitChatError = (socket: Socket, message: string) => {
  socket.emit("chat:error", { message });
};

/* -------------------------------------------------------------------------- */
/* CHAT HANDLERS */
/* -------------------------------------------------------------------------- */
export const registerChatHandlers = (socket: Socket, userId: string) => {
  socket.on("conversation:join", async (conversationId: string) => {
    try {
      const parsedData = ConversationIdSchema.safeParse(conversationId);
      if (!parsedData.success) {
        emitChatError(socket, "Invalid conversation ID");
        return;
      }

      const conversation = await getUserConversation(conversationId, userId);

      if (!conversation) {
        emitChatError(socket, "Conversation not found");
        return;
      }

      if (conversation.status !== "ACTIVE") {
        emitChatError(socket, "Conversation is closed");
        return;
      }

      socket.join(getConversationRoom(conversationId));
      logger.info(`[CHAT] User ${userId} joined conversation ${conversationId}`);
    } catch (error) {
      logger.error(`[CHAT] Join conversation error: ${String(error)}`);
      emitChatError(socket, "Unable to join conversation");
    }
  });

  /* -------------------------------------------------------------------------- */
  /* LEAVE CONVERSATION */
  /* -------------------------------------------------------------------------- */

  socket.on("conversation:leave", (conversationId: string) => {
    socket.leave(getConversationRoom(conversationId));

    logger.info(`[CHAT] User ${userId} left conversation ${conversationId}`);
  });

  /* -------------------------------------------------------------------------- */
  /* SEND MESSAGE */
  /* -------------------------------------------------------------------------- */

  socket.on("message:send", async (payload) => {
    try {
      const parsedData = SendMessageSchema.safeParse(payload);
      if (!parsedData.success) {
        emitChatError(socket, "Invalid message data");
        return;
      }

      const { conversationId, content } = parsedData.data;

      //Check conversation
      const conversation = await getUserConversation(conversationId, userId);

      if (!conversation) {
        emitChatError(socket, "Conversation not found");
        return;
      }

      if (conversation.status !== "ACTIVE") {
        emitChatError(socket, "Conversation is closed");
        return;
      }

      //Find recipent
      const recipientId = conversation.ownerId === userId ? conversation.brokerId : conversation.ownerId;

      const message = await prisma.$transaction(async (tx) => {
        const newMessage = await tx.message.create({
          data: {
            conversationId,
            senderId: userId,
            content,
            isRead: false,
          },
          select: {
            id: true,
            conversationId: true,
            senderId: true,
            content: true,
            isRead: true,
            createdAt: true,
          },
        });

        await tx.conversation.update({
          where: {
            id: conversationId,
          },
          data: {
            lastMessageAt: newMessage.createdAt,
          },
        });

        return newMessage;
      });

      //Socket instance
      const io = getIO();

      //send message to conversation
      io.to(getConversationRoom(conversationId)).emit("message:new", message);

      //Notify recipient directly
      io.to(getUserRoom(recipientId)).emit("message:notification", {
        conversationId,
        messageId: message.id,
        senderId: userId,
        content: message.content,
        createdAt: message.createdAt,
      });

      logger.info(`[CHAT] Message ${message.id} sent by ${userId} in conversation ${conversationId}`);
    } catch (error) {
      logger.error(`[CHAT] Send message error: ${String(error)}`);
      emitChatError(socket, "Unable to send message");
    }
  });
};
