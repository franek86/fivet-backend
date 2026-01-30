import { NextFunction, Request, Response } from "express";
import {
  CreateEventInput,
  CreateEventSchema,
  EditEventInput,
  EditEventSchema,
  FilterEventQuery,
  FilterEventSchema,
} from "../schemas/event.schema";
import prisma from "../prismaClient";

import { EventPriority, EventStatus, Prisma } from "@prisma/client";
import { JwtPayload } from "jsonwebtoken";

/*  CREATE EVENT AUTH USER */
export const createEvent = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }
  try {
    const validate: CreateEventInput = CreateEventSchema.parse({ ...req.body, userId: userId });

    const newEvent = await prisma.event.create({ data: { ...validate } });
    res.status(201).json(newEvent);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET ALL EVENTS WITH PAGINATION AND FILTER */
export const getAllEvents = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.user as JwtPayload;

  if (!userId) {
    res.status(404).json({ message: "User could not found" });
  }

  const parsedEventData = FilterEventSchema.safeParse(req.query);
  if (!parsedEventData.success) {
    res.status(400).json({ errors: parsedEventData.error.errors });
    return;
  }

  const { pageNumber, pageSize, status, priority, startDate, endDate, search } = parsedEventData.data as FilterEventQuery;
  const skip = (pageNumber - 1) * pageSize;

  const where: Prisma.EventWhereInput = {};

  if (userId) where.userId = userId;

  if (status) where.status = status as EventStatus;
  if (priority) where.priority = priority as EventPriority;

  if (startDate && endDate) {
    where.AND = [{ start: { lte: endDate } }, { end: { gte: startDate } }];
  } else if (startDate) {
    where.end = { gte: startDate };
  } else if (endDate) {
    where.start = { lte: endDate };
  }

  if (search) {
    where.OR = [{ title: { contains: search, mode: "insensitive" } }, { description: { contains: search, mode: "insensitive" } }];
  }

  try {
    const events = await prisma.event.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
    });
    const total = await prisma.event.count({ where });
    res.status(200).json({ events, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* SINGLE EVENT */
export const getSingleEvent = async (req: Request<{ id: string }>, res: Response, next: NextFunction) => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Event ID is required" });
    return;
  }

  try {
    const findEvent = await prisma.event.findUnique({ where: { id } });
    if (!findEvent) {
      res.status(404).json({ message: "Event could not found" });
      return;
    }

    res.status(200).json(findEvent);
  } catch (error) {
    next(error);
  }
};

/* UPDATE EVENT BY ID */
export const updateEventById = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) res.status(404).json({ message: "Event ID does not exists." });

  const userId = req.user?.userId;
  if (!userId) {
    res.status(404).json({ message: "Unauthorized" });
    return;
  }

  const parsedData = EditEventSchema.safeParse(req.body);
  if (!parsedData.success) {
    res.status(400).json({ errors: parsedData.error.errors });
    return;
  }

  const updatedData: EditEventInput = parsedData.data;

  try {
    const eventId = await prisma.event.findUnique({ where: { id } });
    if (!eventId) {
      res.status(404).json({ message: "Event is required" });
      return;
    }

    const updateEvent = await prisma.event.update({
      where: { id },
      data: { ...updatedData, userId: userId },
    });
    res.status(200).json(updateEvent);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE EVENT BY ID  */
export const deleteEvent = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(401).json({ message: "Event id are required" });
    return;
  }

  try {
    const findEventById = await prisma.event.findUnique({ where: { id } });
    if (!findEventById) {
      res.status(404).json({ message: "Event not found" });
      return;
    }

    await prisma.event.delete({
      where: { id },
    });

    res.status(200).json({
      message: `Event by ${id} deleted successfully`,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* CREATE LAST FIVE EVENETS AND FILTER BY DATE WHERE ID = USER ID */
export const recentEvents = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = req.user as JwtPayload;
  if (!userId) {
    res.status(404).json({ message: "User could not found." });
    return;
  }

  const parsedEventData = FilterEventSchema.safeParse(req.query);
  if (!parsedEventData.success) {
    res.status(400).json({ errors: parsedEventData.error.errors });
    return;
  }

  const where: Prisma.EventWhereInput = {};
  const { startDate, endDate } = parsedEventData.data as FilterEventQuery;

  if (startDate && endDate) {
    where.AND = [{ start: { lte: endDate } }, { end: { gte: startDate } }];
  } else if (startDate) {
    where.end = { gte: startDate };
  } else if (endDate) {
    where.start = { lte: endDate };
  }

  try {
    if (userId) where.userId = userId;

    const data = await prisma.event.findMany({
      where,
      take: 7,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json(data);
  } catch (error) {
    next(error);
  }
};
