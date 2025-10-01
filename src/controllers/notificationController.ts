import { Request, Response } from "express";
import prisma from "../prismaClient";

export const getNotifications = async (req: Request, res: Response): Promise<any> => {
  try {
    const response = await prisma.notification.findMany({
      where: { userId: req.user?.userId },
      orderBy: { createdAt: "desc" },
    });

    return res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUnreadNotification = async (req: Request, res: Response): Promise<any> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    return res.json({ notifications, unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUnreadNotification = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const { isRead } = req.body;
  try {
    const updated = await prisma.notification.update({
      where: { id: Number(id) },
      data: { isRead },
    });

    res.json({ message: "Notification marked as read", notification: updated });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};
