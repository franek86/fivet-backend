import { Request, Response } from "express";
import prisma from "../prismaClient";

import { UpdateNotificationInput, UpdateNotificationSchema } from "../schemas/notification.schema";

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  try {
    const response = await prisma.notification.findMany({
      where: { userId: req.user?.userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUnreadNotification = async (req: Request, res: Response): Promise<void> => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.userId, isRead: false },
      orderBy: { createdAt: "desc" },
      take: 3,
    });

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUnreadNotification = async (req: Request<{ id: string }, {}, UpdateNotificationInput>, res: Response): Promise<void> => {
  const { id } = req.params;

  const parsedData = UpdateNotificationSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ errors: parsedData.error.errors });
    return;
  }
  const { isRead } = parsedData.data;
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

export const deleteNotification = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const notificationId = Number(id);
  if (!notificationId) {
    res.status(401).json({ message: "Notification ID are required" });
    return;
  }
  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) {
      res.status(404).json({ message: "Notification ID not found" });
      return;
    }

    await prisma.notification.delete({
      where: { id: notificationId },
    });
    res.status(200).json({
      message: `Notification by ${id} deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};
