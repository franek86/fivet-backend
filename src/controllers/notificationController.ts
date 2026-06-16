import { Request, Response } from "express";
import { NotificationType } from "@prisma/client";
import prisma from "../prismaClient";

import { UpdateNotificationInput, UpdateNotificationSchema } from "../schemas/notification.schema";
import { getIO } from "../services/socket.service";

export const sendAdminNotification = async (userId: string, message: string, type: NotificationType) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      message,
      type,
    },
  });

  const io = getIO();

  // 2. Send to admin dashboard
  io.to("admin-room").emit("admin:notification:new", {
    id: notification.id,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
  });

  //Update unread count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: notification.userId,
      isRead: false,
    },
  });

  io.to("admin-room").emit("admin:notification:count", {
    count: unreadCount,
  });

  return notification;
};

export const sendUserNotification = async (userId: string, message: string, type: NotificationType) => {
  const notification = await prisma.notification.create({
    data: {
      userId,
      message,
      type,
    },
  });

  const io = getIO();

  // 1. Send to specific user
  io.to(`user:${userId}`).emit("user:notification:new", {
    id: notification.id,
    message: notification.message,
    type: notification.type,
    createdAt: notification.createdAt,
  });

  //Update unread count
  const unreadCount = await prisma.notification.count({
    where: {
      userId: notification.userId,
      isRead: false,
    },
  });

  io.to(`user:${userId}`).emit("user:notification:count", {
    userId: notification.userId,
    count: unreadCount,
  });

  return notification;
};

export const getNotifications = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(404).json("User not found.");
    return;
  }

  try {
    const response = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(response);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const getUnreadNotification = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId;
  if (!userId) {
    res.status(404).json("User not found.");
    return;
  }
  try {
    const [notifications, unreadCount] = await prisma.$transaction([
      prisma.notification.findMany({
        where: { userId, isRead: false },
        orderBy: { createdAt: "desc" },
        take: 3,
      }),

      prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      }),
    ]);

    res.json({ notifications, unreadCount });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};

export const updateUnreadNotification = async (req: Request<{ id: string }, {}, UpdateNotificationInput>, res: Response): Promise<void> => {
  const notificationId = Number(req.params.id);

  if (Number.isNaN(notificationId)) {
    res.status(400).json({ message: "Invalid notification id" });
    return;
  }

  try {
    const parsedData = UpdateNotificationSchema.safeParse(req.body);

    if (!parsedData.success) {
      res.status(400).json({ errors: parsedData.error.errors });
      return;
    }
    const { isRead } = parsedData.data;

    const existing = await prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!existing) {
      res.status(404).json({ message: "Notification not found" });
      return;
    }

    if (existing.isRead === isRead) {
      res.json({
        message: "No change",
        notification: existing,
      });
      return;
    }

    const updated = await prisma.notification.update({
      where: { id: notificationId },
      data: { isRead },
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: updated.userId,
        isRead: false,
      },
    });
    console.log("Updated notification ", unreadCount);
    const io = getIO();
    io.to(`user:${updated.userId}`).emit("user:notification:count", {
      id: updated.userId,
      count: unreadCount,
    });

    io.to(`user:${updated.userId}`).emit("user:notification:updated", {
      id: updated.id,
      isRead: updated.isRead,
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

    const unreadCount = await prisma.notification.count({
      where: {
        userId: notification.userId,
        isRead: false,
      },
    });
    console.log("Deleted notification ", unreadCount);
    const io = getIO();
    io.to("admin-room").emit("admin:notification:count", {
      count: unreadCount,
    });
    io.to(`user:${notification.userId}`).emit("user:notification:count", {
      count: unreadCount,
    });

    res.status(200).json({
      message: `Notification by ${id} deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: (error as Error).message });
  }
};
