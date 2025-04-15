/* 
ONLY ADMIN CAN CREATE, DELETE AND UPDATE SHIP TYPE
Verify Admin with authAdmin middleware in route
*/
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CreateShipTypeRequest, DeleteShipTypeRequest, UpdateShipTypeRequest } from "../types";
import { getPaginationParams } from "../helpers/pagination";
import { parseSortBy } from "../helpers/parseSortBy";

const prisma = new PrismaClient();

/* CREATE SHIP TYPE BY ADMIN 
  Only admin can create ship type
*/

export const createShipType = async (req: CreateShipTypeRequest, res: Response): Promise<any> => {
  const { name, description } = req.body;

  try {
    const createNewData = await prisma.shipType.create({
      data: {
        name,
        description,
      },
    });

    return res.status(200).json({
      message: "Ship type added successfully!",
      data: createNewData,
    });
  } catch (error) {
    console.log((error as Error).message);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* UPDATE SHIP TYPE BY ADMIN 
  Only admin can edit ship type
*/
export const updateShipType = async (req: UpdateShipTypeRequest, res: Response): Promise<any> => {
  const { id } = req.params;

  if (!id) return res.status(400).json({ message: "Ship type id could not found" });

  const { name, description } = req.body;

  try {
    const shipType = await prisma.shipType.findUnique({ where: { id } });
    if (!shipType) return res.status(404).json({ message: "Ship type is required" });

    const updateShipType = await prisma.shipType.update({
      where: { id },
      data: {
        name,
        description,
      },
    });

    return res.status(200).json({ message: "Ship type updated successfully", data: updateShipType });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* DELETE SHIP TYPE BY ID FOR ADMIN
  Only admin can delete ship type
*/

export const deleteShipType = async (req: DeleteShipTypeRequest, res: Response): Promise<any> => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ message: "Ship type ID is required" });

  try {
    const findShipType = await prisma.shipType.findUnique({ where: { id } });
    if (!findShipType) return res.status(404).json({ message: "Ship type could not found" });

    await prisma.shipType.delete({ where: { id } });

    return res.status(200).json({ message: "Ship type deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* GET SHIP TYPE WITH PAGINATION AND SORT
  Public route
*/
export const getShipType = async (req: Request, res: Response): Promise<any> => {
  const { pageNumber, pageSize, skip } = getPaginationParams(req.query);
  const { sortBy } = req.query;

  const orderBy = parseSortBy(sortBy as string, ["name", "createdAt"], { createdAt: "desc" });

  try {
    const shipType = await prisma.shipType.findMany({
      skip,
      take: pageSize,
      orderBy,
    });

    const totalShipsType = await prisma.shipType.count();

    return res.status(200).json({
      page: pageNumber,
      limit: pageSize,
      totalShipsType,
      totalPages: Math.ceil(totalShipsType / pageSize),
      data: shipType,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* GET ALL SHIP TYPE
  Public route
*/
export const getAllShipType = async (req: Request, res: Response): Promise<any> => {
  try {
    const shipType = await prisma.shipType.findMany({
      orderBy: { name: "desc" },
    });
    return res.status(200).json(shipType);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
