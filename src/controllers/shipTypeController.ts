/* 
ONLY ADMIN CAN CREATE, DELETE AND UPDATE SHIP TYPE
Verify Admin with authAdmin middleware in route
*/
import { Request, Response } from "express";
import { Prisma } from "@prisma/client";
import prisma from "../prismaClient";

import { buildPageMeta, parsePagination } from "../utils/pagination";
import { ShipTypeFilterSchema } from "../schemas/shipType.schema";

/* CREATE SHIP TYPE BY ADMIN 
  Only admin can create ship type
*/
export const createShipType = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;

  try {
    const createNewData = await prisma.shipType.create({
      data: {
        name,
        description,
      },
    });

    res.status(201).json({
      message: "Ship type added successfully!",
      data: createNewData,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATE SHIP TYPE BY ADMIN 
  Only admin can edit ship type
*/
export const updateShipType = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "Ship type id could not found" });
    return;
  }

  const { name, description } = req.body;

  try {
    const shipType = await prisma.shipType.findUnique({ where: { id } });
    if (!shipType) {
      res.status(404).json({ message: "Ship type is required" });
      return;
    }
    const updateShipType = await prisma.shipType.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    res.status(200).json({ message: "Ship type updated successfully", data: updateShipType });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE SHIP TYPE BY ID FOR ADMIN
  Only admin can delete ship type
*/

export const deleteShipType = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ message: "Ship type ID is required" });
    return;
  }

  try {
    const findShipType = await prisma.shipType.findUnique({ where: { id } });
    if (!findShipType) {
      res.status(404).json({ message: "Ship type could not found" });
      return;
    }

    await prisma.shipType.delete({ where: { id } });

    res.status(200).json({ message: "Ship type deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET SHIP TYPE WITH PAGINATION AND SORT
  Public route
*/
export const getShipType = async (req: Request, res: Response): Promise<void> => {
  const result = ShipTypeFilterSchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid filters",
      errors: result.error.flatten(),
    });

    return;
  }

  const filters = result.data;

  const whereCondition: Prisma.ShipTypeWhereInput = {};
  const skip = (filters.page - 1) * filters.limit;

  if (filters.search && typeof filters.search === "string" && filters.search.trim().length > 0) {
    whereCondition.OR = [
      {
        name: {
          contains: filters.search.trim(),
          mode: "insensitive",
        },
      },
      {
        description: { contains: filters.search.trim(), mode: "insensitive" },
      },
    ];
  }

  try {
    const shipType = await prisma.shipType.findMany({
      where: whereCondition,
      skip,
      take: filters.limit,
      orderBy: { [filters.sortBy]: filters.order },
    });

    const total = await prisma.shipType.count();

    const meta = buildPageMeta(total, filters.page, filters.limit);

    res.status(200).json({
      meta,
      data: shipType,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET ALL SHIP TYPE
  Public route
*/
export const getAllShipType = async (req: Request, res: Response): Promise<void> => {
  try {
    const shipType = await prisma.shipType.findMany({
      orderBy: { name: "desc" },
    });
    res.status(200).json(shipType);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
