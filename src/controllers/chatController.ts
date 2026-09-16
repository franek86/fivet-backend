import { Request, Response } from "express";
import prisma from "../prismaClient";
import { logger } from "../config/logger";

/* 
get chat messages 
*/
export const getChatMessages = async (req: Request<{ conversationId: string }>, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });

    if (!conversation) {
      return res.status(404).json({
        message: "Conversation not found",
      });
    }

    const isParticipant = conversation.ownerId === userId || conversation.brokerId === userId;

    if (!isParticipant) {
      return res.status(403).json({
        message: "You are not part of this conversation",
      });
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    logger.error("[CHAT] Get messages error");
    console.log(error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

/* Get conversation */

export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        OR: [{ ownerId: userId }, { brokerId: userId }],
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },

        broker: {
          select: {
            id: true,
            fullName: true,
            avatar: true,
          },
        },

        messages: {
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
          select: {
            id: true,
            senderId: true,
            content: true,
            createdAt: true,
            isRead: true,
          },
        },
      },

      orderBy: {
        lastMessageAt: "desc",
      },
    });

    const result = conversations.map((conversation) => {
      const otherUser = conversation.ownerId === userId ? conversation.broker : conversation.owner;

      const lastMessage = conversation.messages[0] ?? null;

      return {
        id: conversation.id,

        user: {
          id: otherUser.id,
          name: `${otherUser.fullName}`,
          avatar: otherUser.avatar,
        },

        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              content: lastMessage.content,
              senderId: lastMessage.senderId,
              createdAt: lastMessage.createdAt,
            }
          : null,

        lastMessageAt: conversation.lastMessageAt,

        unreadCount: 0,
      };
    });

    return res.status(200).json({
      conversations: result,
    });
  } catch (error) {
    console.error("[CHAT] Get conversations error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};
