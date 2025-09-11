import { NextFunction, Request, Response } from "express";
import { eventSchema } from "../schemas/eventSchema";
import prisma from "../prismaClient";
import { getPaginationParams } from "../helpers/pagination";

/* 
    CREATE EVENT AUTH USER
*/
export const createEvent = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const body = eventSchema.parse(req.body);

  try {
    const newEvent = await prisma.event.create({ data: body });
    return res.status(200).json(newEvent);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* GET ALL EVENTS WITH PAGINATION, FILTER AND SORT*/

export const getAllEvents = async (req: Request, res: Response): Promise<any> => {
  const { pageNumber, pageSize, skip } = getPaginationParams(req.query);
  const { search } = req.query;

  const whereCondition: any = {};
  if (search && typeof search === "string" && search.trim().length > 0) {
    whereCondition.OR = [
      {
        title: {
          contains: search.trim(),
          mode: "insensitive",
        },
      },
      {
        description: { contains: search.trim(), mode: "insensitive" },
      },
    ];
  }
  try {
    const events = await prisma.event.findMany({ where: whereCondition, orderBy: { createdAt: "desc" } });
    return res.status(200).json(events);
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error fetching dashboard data." });
  }
};
