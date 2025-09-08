import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { DeleteShipRequest } from "../types";
import { getPaginationParams } from "../helpers/pagination";
import { uploadMultipleFiles, uploadSingleFile } from "../cloudinaryConfig";
import { shipSchema } from "../schemas/shipSchema";
import prisma from "../prismaClient";
import { shipFilters } from "../helpers/shipFilters";
import { parseSortBy } from "../helpers/parseSortBy";
import { ValidationError } from "../helpers/errorHandler";

/* 
CREATE SHIP 
Authenticate user can create ship
*/
export const createShip = async (req: Request, res: Response): Promise<any> => {
  const body = shipSchema.parse(req.body);

  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  let mainImageUrl: string = "";
  let imagesUrls: string[] = [];

  try {
    if (files?.["mainImage"]?.[0]?.path) {
      mainImageUrl = await uploadSingleFile(files["mainImage"][0].path, "ship/mainImage");
    }
    if (files?.["images"]) {
      imagesUrls = await uploadMultipleFiles(files["images"], "ship/images");
    }

    const shipData: Prisma.ShipUncheckedCreateInput = {
      ...body,
      mainImage: mainImageUrl,
      images: imagesUrls,
      isPublished: false,
    };
    const createdShip = await prisma.ship.create({ data: shipData });
    return res.status(200).json({
      message: "Ship added successfully! Awaiting admin approval.",
      data: createdShip,
    });
  } catch (error) {
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
    const filters = shipFilters(req.query);

    const { sortBy } = req.query;
    const orderBy = parseSortBy(sortBy as string, ["shipName", "price", "createdAt"], { createdAt: "desc" });

    const where = {
      isPublished: true,
      ...filters,
    };

    const [ships, totalShips] = await Promise.all([
      prisma.ship.findMany({
        skip,
        take: pageSize,
        where,
        orderBy,
      }),
      prisma.ship.count({ where }),
    ]);

    /*  const ships = await prisma.ship.findMany({
      skip,
      take: pageSize,
      where: { ...filters, isPublished: true },
      orderBy: { createdAt: "desc" },
    });

    const totalShips = await prisma.ship.count({
      where: {
        isPublished: true,
        ...filters,
      },
    }); */

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
PUBLISH SHIPS ADMIN ONLY
*/
export const updatePublishedShip = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { id } = req.params;
  const { isPublished } = req.body;
  if (!id) throw new ValidationError("Ship id not found");

  try {
    const updateShip = await prisma.ship.update({ where: { id }, data: { isPublished } });
    return res.status(200).json(updateShip);
  } catch (error) {
    next(error);
  }
};

/* 
GET ALL SHIPS 
Get all ships from admin published or not published. Users can see only their own ships 
TO DO: filter by status
*/
export const getDashboardShips = async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as CustomJwtPayload;

  const { pageNumber, pageSize, skip } = getPaginationParams(req.query);
  const filters = shipFilters(req.query);
  const { sortBy, search } = req.query;

  try {
    let ships;

    const whereCondition: any = {
      ...filters,
    };

    if (search && typeof search === "string" && search.trim().length > 0) {
      whereCondition.OR = [{ shipName: { contains: search.trim(), mode: "insensitive" } }];
    }

    if (role !== "ADMIN") {
      whereCondition.userId = userId;
    }

    // Sort handling
    const orderBy = parseSortBy(sortBy as string, ["shipName", "price", "createdAt"], { createdAt: "desc" });

    const totalShipsType = (ships = await prisma.ship.count());
    ships = await prisma.ship.findMany({
      skip,
      take: pageSize,
      where: whereCondition,
      orderBy,
      include: {
        user: {
          select: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        shipType: {
          select: {
            name: true,
          },
        },
      },
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
    console.log(error);
    return res.status(500).json({ message: "Error fetching dashboard data." });
  }
};

/* GET SINGLE SHIP BY ID */
export const getShip = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  if (!id) return res.status(404).json({ message: "Ship id are not found!" });
  try {
    const ship = await prisma.ship.findUnique({
      where: { id },
      include: {
        shipType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!ship) {
      return res.status(404).json({ message: "Ship not found" });
    }

    return res.status(200).json(ship);
  } catch (error) {
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* 
UPDATE SHIPS BY ID 
Admin can update all ship, but users can only update their own ships
*/
export const updateShip = async (req: Request, res: Response): Promise<any> => {
  const { id } = req.params;
  /*  const {
    shipName,
    typeId,
    imo,
    refitYear,
    buildYear,
    isPublished,
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
  } = req.body; */

  try {
    const ship = await prisma.ship.findUnique({ where: { id } });

    if (!ship) {
      return res.status(404).json({ message: "Ship not found" });
    }

    // ✅ Validate body
    const parsed = shipSchema.parse(req.body);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    // Handle new files from Multer
    const newImages = files?.images?.map((file) => file.path) || [];
    const uploadedMainImage = files?.mainImage?.[0]?.path || ship.mainImage;

    // Filter out any blob URLs
    const oldImages = Array.isArray(req.body.images) ? req.body.images.filter((img: string) => !img.startsWith("blob:")) : [];

    const updatedShip = await prisma.ship.update({
      where: { id },
      data: {
        ...parsed,
        mainImage: uploadedMainImage,
        images: [...oldImages, ...newImages],
      },
      /* data: {
        shipName,
        typeId,
        isPublished,
        imo,
        buildYear: buildYear ? parseInt(buildYear, 10) : null,
        refitYear: refitYear ? parseInt(refitYear, 10) : null,
        price: parseFloat(price),
        beam: parseFloat(beam),
        location,
        mainEngine,
        lengthOverall,
        length: parseFloat(length),
        depth: parseFloat(depth),
        draft: parseFloat(draft),
        tonnage: parseFloat(tonnage),
        cargoCapacity,
        buildCountry,
        remarks,
        description,
        mainImage: uploadedMainImage,
        images: [...oldImages, ...newImages],
      }, */
    });

    return res.status(200).json({
      message: "Ship updated successfully",
      data: updatedShip,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

/* 
DELETE SHIP BY ID 
Admin can delete all ship, but users can only delete their own ships
*/
export const deleteShip = async (req: DeleteShipRequest, res: Response): Promise<any> => {
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
