import { Request, Response } from "express";
import prisma from "../prismaClient";
import { ValidationError } from "../helpers/errorHandler";

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

export const deleteNotification = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const notificationId = Number(id);
  if (!notificationId) throw new ValidationError("ID does not exists.");
  try {
    const notification = await prisma.notification.findUnique({ where: { id: notificationId } });
    if (!notification) throw new ValidationError("Notification not found.");

    await prisma.notification.delete({
      where: { id: notificationId },
    });
    return res.status(200).json({
      message: `Notification by ${id} deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};
