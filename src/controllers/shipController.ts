import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { DeleteShipRequest } from "../types";
import { getPaginationParams } from "../helpers/pagination";

const prisma = new PrismaClient();

/* 
CREATE SHIP 
Authenticate user can create ship
*/
export const createShip = async (req: Request, res: Response): Promise<any> => {
  const {
    shipName,
    imo,
    refitYear,
    buildYear,
    price,
    location,
    mainEngine,
    lengthOverall,
    beam,
    length,
    depth,
    draft,
    tonnage,
    cargoCapacity,
    buildCountry,
    remarks,
    description,
    mainImage,
    images,
    userId,
    typeId,
  } = req.body;

  try {
    const shipData = await prisma.ship.create({
      data: {
        shipName,
        imo,
        refitYear,
        buildYear,
        price,
        location,
        mainEngine,
        lengthOverall,
        beam,
        length,
        depth,
        draft,
        tonnage,
        cargoCapacity,
        buildCountry,
        remarks,
        description,
        mainImage,
        images,
        isPublished: false,

        user: {
          connect: { id: userId },
        },

        shipType: {
          connect: { id: typeId },
        },
      },
    });

    return res.status(200).json({
      message: "Ship added successfully! Awaiting admin approval.",
      data: shipData,
    });
  } catch (error) {
    console.error("Error creating ship:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* 
GET PUBLISHED SHIPS 
It is public route. Get all published ships with pagination, sort, filters
TO DO: add filters
*/
export const getAllPublishedShips = async (req: Request, res: Response): Promise<any> => {
  try {
    const { pageNumber, pageSize, skip } = getPaginationParams(req.query);

    const ships = await prisma.ship.findMany({
      skip,
      take: pageSize,
      where: { isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    const totalShips = await prisma.ship.count();

    return res.status(200).json({
      page: pageNumber,
      limit: pageSize,
      totalShips,
      totalPages: Math.ceil(totalShips / pageSize),
      data: ships,
    });
  } catch (error) {}
};

/* 
GET ALL SHIPS 
Get all ships from admin published or not published. Users can see only their own ships 
TO DO: add filters
*/
export const getDashboardShips = async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as CustomJwtPayload;

  const { shipType, status, search } = req.query;
  const { pageNumber, pageSize, skip } = getPaginationParams(req.query);

  try {
    let ships;

    const whereCondition: any = {};

    // Apply filters if provided
    if (shipType) {
      whereCondition.shipType = Array.isArray(shipType) ? { in: shipType } : shipType;
    }

    if (status) {
      whereCondition.status;
    }

    if (search) {
      whereCondition.OR = [
        {
          shipName: {
            contains: search as string,
            mode: "insensitive",
          },
        },

        {
          shipName: {
            contains: search as string,
            mode: "insensitive",
          },
        },
      ];
    }

    if (role !== "ADMIN") {
      whereCondition.userId = userId;
    }

    const totalShipsType = (ships = await prisma.ship.count());
    ships = await prisma.ship.findMany({
      skip,
      take: pageSize,
      where: whereCondition,
    });

    return res.status(200).json({
      message: "Ships fetched successfully.",
      page: pageNumber,
      limit: pageSize,
      totalShipsType,
      totalPages: Math.ceil(totalShipsType / pageSize),
      data: ships,
    });
  } catch (error) {
    return res.status(500).json({ message: "Error fetching dashboard data." });
  }
};

/* GET SINGLE SHIP BY ID */
export const getShip = async (req: Request, res: Response): Promise<any> => {};

/* 
UPDATE SHIPS BY ID 
Admin can update all ship, but users can only update their own ships
*/
export const updateShip = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  const {
    shipName,
    typeId,
    imo,
    refitYear,
    buildYear,
    price,
    location,
    mainEngine,
    lengthOverall,
    beam,
    length,
    depth,
    draft,
    tonnage,
    cargoCapacity,
    buildCountry,
    remarks,
    description,
    mainImage,
    images,
  } = req.body;

  try {
    const ship = await prisma.ship.findUnique({ where: { id } });

    if (!ship) {
      return res.status(404).json({ message: "Ship not found" });
    }

    const updatedShip = await prisma.ship.update({
      where: { id },
      data: {
        shipName,
        typeId,
        imo,
        refitYear,
        buildYear,
        price,
        location,
        mainEngine,
        lengthOverall,
        beam,
        length,
        depth,
        draft,
        tonnage,
        cargoCapacity,
        buildCountry,
        remarks,
        description,
        mainImage,
        images,
      },
    });

    return res.status(200).json({
      message: "Ship updated successfully",
      data: updatedShip,
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* 
DELETE SHIP BY ID 
Admin can delete all ship, but users can only delete their own ships
*/
export const deleteShip = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;

  try {
    const ship = await prisma.ship.findUnique({ where: { id } });

    if (!ship) {
      return res.status(404).json({ message: "Ship not found" });
    }

    await prisma.ship.delete({
      where: { id },
    });

    return res.status(200).json({
      message: "Ship deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};
