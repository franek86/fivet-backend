import { NextFunction, Request, Response } from "express";
import { CreateEventSchema, filterEventSchema } from "../schemas/event.schema";
import prisma from "../prismaClient";
import { getPaginationParams } from "../helpers/pagination";
import { ValidationError } from "../helpers/errorHandler";

/*  CREATE EVENT AUTH USER */
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  try {
    const validate = CreateEventSchema.parse(req.body);
    const userId = req.user?.id;
    if (!userId) return res.status(404).json({ message: "Unauthorized" });

    const newEvent = await prisma.event.create({ data: { ...validate, userId: userId } });
    return res.status(200).json(newEvent);
  } catch (error) {
    console.log(error);
    next();
  }
};

/* GET ALL EVENTS WITH PAGINATION AND FILTER */
export const getAllEvents = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const parsedEventData = filterEventSchema.safeParse(req.query);
  if (!parsedEventData.success) {
    return res.status(400).json({ errors: parsedEventData.error.errors });
  }

  const { pageNumber, pageSize, skip } = getPaginationParams(req.query);
  const { search, status, priority, startDate, endDate } = parsedEventData.data;

  const where: any = {};

  if (status) where.status = status;
  if (priority) where.priority = priority;

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
    return res.status(200).json({ events, page: pageNumber, limit: pageSize, total, totalPages: Math.ceil(total / pageSize) });
  } catch (error) {
    console.log(error);
    next();
  }
};

/* SINGLE EVENT */
export const getSingleEvent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Id could not found" });

  try {
    const findEvent = await prisma.event.findUnique({ where: { id } });
    if (!findEvent) return res.status(400).json({ message: "Event could not found" });

    return res.status(200).json(findEvent);
  } catch (error) {
    console.log(error);
    next();
  }
};

/* UPDATE EVENT BY ID */
export const updateEventById = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) throw new ValidationError("Event ID does not exists.");

  const parsedData = CreateEventSchema.safeParse(req.body);
  if (!parsedData.success) {
    return res.status(400).json({ errors: parsedData.error.errors });
  }
  try {
    const eventId = await prisma.event.findUnique({ where: { id } });
    if (!eventId) return res.status(404).json({ message: "Event is required" });
    const updateEvent = await prisma.event.update({
      where: { id },
      data: parsedData.data,
    });
    return res.status(200).json(updateEvent);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE EVENT BY ID  */
export const deleteEvent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  if (!id) throw new ValidationError("ID does not exists.");

  try {
    const findEventById = await prisma.event.findUnique({ where: { id } });
    if (!findEventById) throw new ValidationError("Event not found.");

    await prisma.event.delete({
      where: { id },
    });

    return res.status(200).json({
      message: `Event by ${id} deleted successfully`,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
