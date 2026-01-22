import prisma from "../prismaClient";
import { Request, Response } from "express";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { buildPageMeta, parsePagination } from "../utils/pagination";
import cloudinary, { uploadMultipleFiles, uploadSingleFile } from "../cloudinaryConfig";
import { CreateShipSchema, EditShipSchema } from "../schemas/ship.schema";
import { shipFilters } from "../utils/shipFilters";
import { parseSortBy } from "../helpers/sort.helpers";
import { sendEmail } from "../utils/sendMail";
import { formatDate } from "../helpers/date.helpers";
import { sendNotification } from "./notificationController";
import { getIO } from "../services/socket.service";

/* 
CREATE SHIP 
Authenticate user can create ship
*/
export const createShip = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId;
  if (!userId) res.status(401).json({ message: "Unauthorized" });

  try {
    const files = req.files as {
      // [fieldname: string]: Express.Multer.File[];
      mainImage?: Express.Multer.File[];
      images?: Express.Multer.File[];
    };

    if (!files?.mainImage?.[0]) {
      res.status(400).json({
        error: "MAIN_IMAGE_REQUIRED",
        message: "Main image is required",
      });
      return;
    }

    let imagesData: { url: string; publicId: string }[] = [];
    const { url: mainImageUrl, publicId: mainImageId } = await uploadSingleFile(files.mainImage[0].buffer, "ship/mainImage");
    if (files?.images?.length) {
      imagesData = await uploadMultipleFiles(files.images, "ship/images");
    }

    const imagesUrls = imagesData?.map((i) => i.url);
    const imageIds = imagesData?.map((id) => id.publicId);

    const validateData = CreateShipSchema.parse({
      ...req.body,
      mainImage: mainImageUrl,
      mainImagePublicId: mainImageId,
      images: imagesUrls,
      imageIds,
    });

    const newShip = await prisma.ship.create({
      data: {
        ...validateData,
        userId: userId,
        mainImage: mainImageUrl,
        mainImagePublicId: mainImageId,
        images: imagesUrls,
        imageIds,
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
      //emit event to all admins new ship

      await prisma.notification.create({
        data: {
          message: `${fullName} created a new ship: ${newShip.shipName}`,
          userId: admin.id,
        },
      });

      await sendEmail(emailToSend, "New Ship Pending Approval", "ship-notification-email", emailData);
    }

    const io = getIO();
    io.to("admins").emit("new-ship", {
      ownerName: fullName,
      shipTitle: newShip.shipName,
      shipIMO: newShip.imo,
      createdAt: formatDate(newShip.createdAt.toISOString()),
    });

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

*/
export const getAllPublishedShips = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
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
        take: limit,
        where,
        orderBy,
        select: {
          id: true,
          shipName: true,
          slug: true,
          imo: true,
          typeId: true,
          shipType: {
            select: {
              name: true,
            },
          },
          refitYear: true,
          buildYear: true,
          price: true,
          location: true,
          latitude: true,
          longitude: true,
          mainEngine: true,
          lengthOverall: true,
          beam: true,
          length: true,
          depth: true,
          draft: true,
          tonnage: true,
          cargoCapacity: true,
          buildCountry: true,
          remarks: true,
          description: true,
          mainImage: true,
          images: true,
          clicks: true,
          createdAt: true,
        },
      }),
      prisma.ship.count({ where }),
    ]);

    const meta = buildPageMeta(totalShips, page, limit);

    res.status(200).json({
      meta,
      data: ships,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
  GET SHIPS STATISTIC FOR NUMBERIC FIELDS. THAT WILL USE ON FRONTEND TO TAKE MINMAX NUMERIC FIELDS
*/
// GET /ships/stats
export const getShipsNumericFields = async (req: Request, res: Response) => {
  try {
    // Compute min/max for numeric fields across all published ships
    const numericStats = await prisma.ship.aggregate({
      where: { isPublished: true },
      _min: { beam: true, tonnage: true, draft: true, length: true, cargoCapacity: true, depth: true, price: true },
      _max: { beam: true, tonnage: true, draft: true, length: true, cargoCapacity: true, depth: true, price: true },
    });

    res.status(200).json({ numericStats });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
PUBLISH SHIPS ADMIN ONLY
*/
export const updatePublishedShip = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const { id } = req.params;
  const { isPublished } = req.body;
  if (!id) {
    res.status(401).json({ message: "Id is required" });
    return;
  }

  try {
    const updatedShip = await prisma.ship.update({ where: { id }, data: { isPublished } });
    if (isPublished && updatedShip.userId) {
      await sendNotification(updatedShip.userId, `Your "${updatedShip.shipName}" are published live!`, "INFO");
    }

    res.status(200).json(updatedShip);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
GET ALL SHIPS 
Get all ships from admin published or not published. Users can see only their own ships 
*/
export const getDashboardShips = async (req: Request, res: Response): Promise<any> => {
  const { userId, role } = req.user as CustomJwtPayload;

  const { page, limit, skip } = parsePagination(req.query);
  const { sortBy } = req.query;

  const filters = shipFilters(req.query);

  try {
    let data;

    const whereCondition: any = {
      ...filters,
    };

    // Sort handling

    if (role !== "ADMIN") {
      whereCondition.userId = userId;
    }

    const orderBy = parseSortBy(sortBy as string, ["shipName", "price", "createdAt"], { createdAt: "desc" });
    const totalShips = (data = await prisma.ship.count());

    data = await prisma.ship.findMany({
      skip,
      take: limit,
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

    const meta = buildPageMeta(totalShips, page, limit);

    return res.status(200).json({
      message: "Ships fetched successfully.",
      meta,
      data,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Error fetching dashboard data." });
  }
};

/* GET SINGLE SHIP BY ID DASHBOARD ONLY */
export const getShip = async (req: Request<{ id: string }>, res: Response): Promise<any> => {
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

/* GET PUBLISHED SINGLE SHIP BY ID AND UPDATE CLICKS */
export const getPublishedShip = async (req: Request<{ slug: string }>, res: Response) => {
  const { slug } = req.params;
  if (!slug) {
    res.status(404).json({ message: "Ship slug are not found!" });
    return;
  }
  try {
    const ship = await prisma.ship.findUnique({
      where: { slug, isPublished: true },
      include: {
        shipType: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!ship) {
      res.status(404).json({ message: "Ship not found" });
      return;
    }

    await prisma.ship.update({
      where: { slug, isPublished: true },
      data: {
        clicks: {
          increment: 1,
        },
      },
    });

    res.status(200).json(ship);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
UPDATE SHIPS BY ID 
Admin can update all ship, but users can only update their own ships
*/
export const updateShip = async (req: Request<{ id: string }>, res: Response): Promise<any> => {
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
    let mainImageId = existingShip.mainImagePublicId;
    let imagesUrls = existingShip.images || [];
    let imageIds = existingShip.imageIds || [];

    /* main image update */
    if (files?.["mainImage"]?.[0]?.path) {
      //Delete old image from cloudinary
      if (mainImageId) {
        await cloudinary.uploader.destroy(mainImageId);
      }

      //upload new main image
      const uploadMainImage = await uploadSingleFile(files["mainImage"][0].buffer, "ship/mainImage");

      mainImageUrl = uploadMainImage.url;
      mainImageId = uploadMainImage.publicId;
    }

    /* DELETE OLD IMAGES THAT USER WANTS TO REMOVE */
    let deleteImageIds: string[] = [];

    if (req.body.deleteImageIds) {
      deleteImageIds = JSON.parse(req.body.deleteImageIds);
    }

    // 1. delete selected images from Cloudinary
    for (const publicId of deleteImageIds) {
      try {
        await cloudinary.uploader.destroy(publicId);
      } catch (err) {
        console.log("Failed to delete image:", publicId);
      }
    }

    // 2. remove them from arrays
    imageIds = imageIds.filter((id) => !deleteImageIds.includes(id));
    imagesUrls = imagesUrls.filter((_, index) => !deleteImageIds.includes(existingShip.imageIds[index]));

    /* Multiple image update */
    if (files?.["images"]) {
      const newImages = await uploadMultipleFiles(files["images"], "ship/images");

      //add new images
      imagesUrls = [...imagesUrls, ...newImages.map((img) => img.url)];
      imageIds = [...imageIds, ...newImages.map((img) => img.publicId)];
    }

    const updatedShip = await prisma.ship.update({
      where: { id },
      data: {
        ...parsed,
        mainImage: mainImageUrl,
        mainImagePublicId: mainImageId,
        images: imagesUrls,
        imageIds: imageIds,
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
export const deleteShip = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
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
