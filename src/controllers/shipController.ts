import prisma from "../prismaClient";
import { Request, Response } from "express";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { getPaginationParams } from "../helpers/pagination";
import { uploadMultipleFiles, uploadSingleFile } from "../cloudinaryConfig";
import { CreateShipSchema, EditShipSchema } from "../schemas/ship.schema";
import { shipFilters } from "../helpers/shipFilters";
import { parseSortBy } from "../helpers/parseSortBy";
import { ValidationError } from "../helpers/errorHandler";
import { sendEmail } from "../utils/sendMail";
import { formatDate } from "../utils/formatDate";

/* 
CREATE SHIP 
Authenticate user can create ship
*/
export const createShip = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) res.status(401).json({ message: "Unauthorized" });

  try {
    const files = req.files as {
      [fieldname: string]: Express.Multer.File[];
    };

    let mainImageUrl: string = "";
    let imagesUrls: string[] = [];

    if (files?.["mainImage"]?.[0]?.path) {
      mainImageUrl = await uploadSingleFile(files["mainImage"][0].path, "ship/mainImage");
    }
    if (files?.["images"]) {
      imagesUrls = await uploadMultipleFiles(files["images"], "ship/images");
    }

    const validateData = CreateShipSchema.parse({
      ...req.body,
      mainImage: mainImageUrl,
      images: imagesUrls,
    });

    const newShip = await prisma.ship.create({
      data: {
        ...validateData,
        userId: userId,
        mainImage: mainImageUrl,
        images: imagesUrls,
        isPublished: false,
      },
    });

    /* call notification for admin when ship created */
    /* Find admin first */
    const admin = await prisma.user.findFirst({
      where: { role: "ADMIN" },
      select: {
        id: true,
        email: true,
      },
    });

    const fullName = req.user?.fullName;
    const shipLink = `${process.env.FRONTEND_URL}/ships/${newShip?.id}`;
    const emailData = {
      shipTitle: newShip.shipName,
      shipIMO: newShip.imo,
      createdAt: formatDate(newShip.createdAt.toISOString()),
      fullName: fullName,
      reviewUrl: shipLink,
    };
    const emailToSend = admin?.email ?? "";

    /* add notification */
    if (req.user!.role !== "ADMIN" && admin) {
      await prisma.notification.create({
        data: {
          message: `${fullName} created a new ship: ${newShip.shipName}`,
          userId: admin.id,
        },
      });
      await sendEmail(emailToSend, "New Ship Pending Approval", "ship-notification-email", emailData);
    }

    res.status(200).json({
      message: "Ship added successfully! Awaiting admin approval.",
      data: newShip,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
GET PUBLISHED SHIPS 
It is public route. Get all published ships with pagination, sort, filters
TO DO: add filters
*/
export const getAllPublishedShips = async (req: Request, res: Response): Promise<void> => {
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

    res.status(200).json({
      page: pageNumber,
      limit: pageSize,
      totalShips,
      totalPages: Math.ceil(totalShips / pageSize),
      data: ships,
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
PUBLISH SHIPS ADMIN ONLY
*/
export const updatePublishedShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isPublished } = req.body;
  if (!id) throw new ValidationError("Ship id not found");

  try {
    const updateShip = await prisma.ship.update({ where: { id }, data: { isPublished } });
    res.status(200).json(updateShip);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
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

  try {
    const existingShip = await prisma.ship.findUnique({ where: { id } });

    if (!existingShip) {
      return res.status(404).json({ message: "Ship not found" });
    }
    const body = {
      ...req.body,
      isPublished: req.body.isPublished === "true", // string -> boolean
    };
    // Validate body
    const parsed = EditShipSchema.parse(body);

    const files = req.files as { [fieldname: string]: Express.Multer.File[] };
    let mainImageUrl = existingShip.mainImage;
    let imagesUrls = existingShip.images || [];

    if (files?.["mainImage"]?.[0]?.path) {
      mainImageUrl = await uploadSingleFile(files["mainImage"][0].path, "ship/mainImage");
    }

    if (files?.["images"]) {
      const newImages = await uploadMultipleFiles(files["images"], "ship/images");
      imagesUrls = [...imagesUrls, ...newImages];
    }

    const updatedShip = await prisma.ship.update({
      where: { id },
      data: {
        ...parsed,
        mainImage: mainImageUrl,
        images: imagesUrls,
      },
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
export const deleteShip = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  try {
    const ship = await prisma.ship.findUnique({ where: { id } });

    if (!ship) {
      res.status(404).json({ message: "Ship not found" });
    }

    await prisma.ship.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Ship deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
