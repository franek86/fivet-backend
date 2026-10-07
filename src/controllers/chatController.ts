import { NextFunction, Request, Response } from "express";
import prisma from "../prismaClient";

import { logger } from "../config/logger";

import { AuthError, NotFoundError } from "../helpers/error.helpers";

import { getChatMessagesService, getConversationsService } from "../services/chat.service";

/* -------------------------------------------------------------------------- */
/* GET CHAT MESSAGES */
/* -------------------------------------------------------------------------- */

export const getChatMessages = async (req: Request<{ conversationId: string }>, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      throw new AuthError("Unauthorized");
    }

    const { conversationId } = req.params;

    const messages = await getChatMessagesService(conversationId, userId);

    return res.status(200).json({
      messages,
    });
  } catch (error) {
    next(error);
  }
};

/* Get conversation */

export const getConversations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const search = req.query.search as string | undefined;

    if (!userId) {
      throw new AuthError("Unauthorized");
    }

    const conversations = await getConversationsService(userId, search);
    res.status(200).json({ conversations });
  } catch (error) {
    next(error);
  }
};
