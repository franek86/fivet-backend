import prisma from "../prismaClient";
import { ForbiddenError, NotFoundError } from "../helpers/error.helpers";
import { Prisma } from "@prisma/client";

/* -------------------------------------------------------------------------- */
/* GET CHAT MESSAGES */
/* -------------------------------------------------------------------------- */
export const getChatMessagesService = async (conversationId: string, userId: string) => {
  //Find conversation
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
    select: { id: true, ownerId: true, brokerId: true },
  });
  if (!conversation) {
    throw new NotFoundError("Conversation not found");
  }

  // Check participant
  const isParticipant = conversation.ownerId === userId || conversation.brokerId === userId;
  if (!isParticipant) {
    throw new ForbiddenError("You are not a participant in this conversation");
  }

  // Get messages
  return prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      conversationId: true,
      senderId: true,
      sender: {
        select: {
          fullName: true,
          avatar: true,
        },
      },
      content: true,
      isRead: true,
      createdAt: true,
    },
  });
};

/* -------------------------------------------------------------------------- */
/* GET CONVERSATIONS */
/* -------------------------------------------------------------------------- */
export const getConversationsService = async (userId: string, search?: string) => {
  const where: Prisma.ConversationWhereInput = {
    OR: [{ ownerId: userId }, { brokerId: userId }],
  };

  if (search?.trim()) {
    const searchValue = search.trim();

    where.AND = {
      OR: [
        {
          owner: {
            fullName: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        },
        {
          owner: {
            email: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        },
        {
          broker: {
            fullName: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        },
        {
          broker: {
            email: {
              contains: searchValue,
              mode: "insensitive",
            },
          },
        },
      ],
    };
  }

  const conversations = await prisma.conversation.findMany({
    where,

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
        orderBy: { createdAt: "desc" },
        take: 1,
        select: {
          id: true,
          senderId: true,
          content: true,
          isRead: true,
          createdAt: true,
        },
      },
      _count: {
        select: {
          messages: {
            where: {
              isRead: false,
              senderId: { not: userId },
            },
          },
        },
      },
    },
    orderBy: { lastMessageAt: "desc" },
  });

  // Response
  return conversations.map((conversation) => {
    const otherUser = conversation.ownerId === userId ? conversation.broker : conversation.owner;
    const lastMessage = conversation.messages[0] ?? null;
    return {
      id: conversation.id,
      user: { id: otherUser.id, name: otherUser.fullName, avatar: otherUser.avatar },
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            content: lastMessage.content,
            senderId: lastMessage.senderId,
            isRead: lastMessage.isRead,
            createdAt: lastMessage.createdAt,
          }
        : null,
      lastMessageAt: conversation.lastMessageAt,
      unreadCount: conversation._count.messages,
    };
  });
};
