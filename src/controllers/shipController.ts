import prisma from "../prismaClient";
import { Request, Response } from "express";
import { CustomJwtPayload } from "../middleware/verifyToken";
import { ListingStatus, NotificationType } from "@prisma/client";
import cloudinary, { uploadMultipleFiles, uploadSingleFile } from "../cloudinaryConfig";
import { getIO } from "../services/socket.service";

import { logger } from "../config/logger";
import { shipFilters } from "../utils/shipFilters";
import { parseSortBy } from "../helpers/sort.helpers";
import { sendEmail } from "../utils/sendMail";
import { buildPageMeta, parsePagination } from "../utils/pagination";
import { formatDate } from "../helpers/date.helpers";

import { sendAdminNotification, sendUserNotification } from "./notificationController";
import { CreateShipSchema, EditShipSchema } from "../schemas/ship.schema";
import { ShipFilterSchema } from "../schemas/shipFilter.schema";

/* 
LIMIT CREATE SHIP FOR USERS DEPEND OF SUBSCRIPTION
Authenticate and subcribed user can create ship
Limitations:  STANDARD 1 pre Year
              PREMIUM 10 per Year
*/
export const SUBSCRIPTION_LIMITS = {
  STARTER: { shipsPerYear: 0 },
  STANDARD: { shipsPerYear: 20 },
  PREMIUM: { shipsPerYear: 10 },
} as const;

/* export const canUserCreateShip = async (
  userId: string,
): Promise<{ allowed: boolean; reason?: string; shipsUsed: number; shipLimit: number }> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true, subscription: true },
  });

  if (!user) throw new Error("User not found");
  // Admins bypass all limits
  if (user.role === "ADMIN") {
    return { allowed: true, shipsUsed: 0, shipLimit: Infinity };
  }
  const limit = SUBSCRIPTION_LIMITS[user.subscription].shipsPerYear;

  if (limit === 0) {
    return { allowed: false, reason: "Upgrade your plan to create ships.", shipsUsed: 0, shipLimit: 0 };
  }
  // Count posts created in the current calendar year
  const startOfYear = new Date(new Date().getFullYear(), 0, 1);

  const shipsThisYear = await prisma.ship.count({
    where: {
      userId,
      createdAt: { gte: startOfYear },
    },
  });

  if (shipsThisYear >= limit) {
    return {
      allowed: false,
      reason: `You've reached your ${limit} ship/year limit for your plan.`,
      shipsUsed: shipsThisYear,
      shipLimit: limit,
    };
  }

  return { allowed: true, shipsUsed: shipsThisYear, shipLimit: limit };
}; */

/* 
CREATE SHIP 
Authenticate user can create ship
*/
export const createShip = async (req: Request, res: Response): Promise<void> => {
  const role = req.user?.role;
  const userId = req.user?.userId;
  if (!userId) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  /* const check = await canUserCreateShip(userId);

  if (!check.allowed) {
    throw new Error(check.reason);
  } */

  try {
    const existingSlug = await prisma.ship.findUnique({ where: { slug: req.body.slug } });
    if (existingSlug) {
      res.status(409).json({
        message: "A ship with this slug already exists",
      });
      return;
    }

    const files = req.files as {
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

    const mainImageFile = files.mainImage[0];
    const mainImageAlt = req.body.mainImageAlt || "";

    // Upload main image
    const mainImagePromise = uploadSingleFile(mainImageFile.buffer, "ship/mainImage");

    // Upload multiple images in parallel
    const imagesFiles = files.images || [];
    const multipleImagesPromise = imagesFiles.length ? uploadMultipleFiles(imagesFiles, "ship/images") : Promise.resolve([]);

    // Parse images metadata safely
    let imagesMeta: { alt?: string }[] = [];
    try {
      imagesMeta = JSON.parse(req.body.imagesMeta || "[]");
    } catch {
      imagesMeta = [];
    }

    // Wait for uploads in parallel
    const [mainImageData, imagesData] = await Promise.all([mainImagePromise, multipleImagesPromise]);

    const formattedImages = imagesData.map((img, index) => ({
      url: img.url,
      publicId: img.publicId,
      alt: imagesMeta[index]?.alt || "",
    }));

    const validateData = CreateShipSchema.parse({
      ...req.body,
      mainImage: mainImageData?.url,
      mainImagePublicId: mainImageData?.publicId,
      mainImageAlt,
      images: formattedImages,
    });

    const newShip = await prisma.ship.create({
      data: {
        ...validateData,
        listedById: userId,
        ownerId: userId,
        mainImage: mainImageData?.url,
        mainImagePublicId: mainImageData?.publicId,
        images: {
          create: formattedImages.map((img) => ({
            alt: img.alt,
            url: img.url,
            publicId: img.publicId,
          })),
        },
        isPublished: false,
      },
    });

    /* Send email to admin */
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

    /* Add notification */
    if (req.user!.role !== "ADMIN" && admin) {
      //send notification to admin
      await sendAdminNotification(admin.id, `New ship created: ${newShip.shipName}`, NotificationType.INFO);

      //Send email to admin
      await sendEmail(emailToSend, "New Ship Pending Approval", "ship-notification-email", emailData);
    }

    res.status(201).json({
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
    const result = ShipFilterSchema.safeParse(req.body);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const whereCondition = shipFilters({ isPublished: true, ...filters });
    const skip = (filters.page - 1) * filters.limit;

    const [ships, totalShips] = await Promise.all([
      prisma.ship.findMany({
        where: whereCondition,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
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
          buildYear: true,
          price: true,
          mainEngine: true,
          lengthOverall: true,
          beam: true,

          draft: true,
          cargoCapacity: true,
          buildCountry: true,

          description: true,
          mainImage: true,
          images: true,
          clicks: true,
          createdAt: true,
        },
      }),
      prisma.ship.count({ where: whereCondition }),
    ]);

    const meta = buildPageMeta(totalShips, filters.page, filters.limit);

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
      _min: { beam: true, draft: true, cargoCapacity: true, price: true },
      _max: { beam: true, draft: true, cargoCapacity: true, price: true },
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
    if (isPublished && updatedShip.listedById) {
      await sendUserNotification(updatedShip.listedById, `Your "${updatedShip.shipName}" are published live!`, "INFO");

      // Notify the ship author in realtime
      const io = getIO();
      const payload = {
        shipId: updatedShip.id,
        shipName: updatedShip.shipName,
      };
      io.to(`user:${updatedShip.listedById}`).emit("ship:published", payload);
    }

    res.status(200).json(updatedShip);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
GET ALL SHIPS 
Get all ships from admin published or not published. Users can see only their own ships 
*/
export const getDashboardShips = async (req: Request, res: Response): Promise<any> => {
  try {
    const { userId, role } = req.user as CustomJwtPayload;

    const result = ShipFilterSchema.safeParse(req.query);

    if (!result.success) {
      console.log("RAW QUERY:", req.query);
      console.log("ZOD ERROR:", result.error.flatten());
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const whereCondition = shipFilters(filters);
    const skip = (filters.page - 1) * filters.limit;

    if (role === "BROKER") {
      whereCondition.listedById = userId;
    }

    if (role === "OWNER") {
      whereCondition.ownerId = userId;
    }

    const [data, total] = await Promise.all([
      prisma.ship.findMany({
        where: whereCondition,
        orderBy: { [filters.sortBy]: filters.order },
        skip,
        take: filters.limit,

        include: {
          shipType: {
            select: {
              name: true,
            },
          },
          listedBy: {
            select: {
              fullName: true,
            },
          },
        },
      }),

      prisma.ship.count({
        where: whereCondition,
      }),
    ]);

    const meta = buildPageMeta(total, filters.page, filters.limit);

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
        images: {
          select: {
            id: true,
            url: true,
            alt: true,
            publicId: true,
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
    const existingShip = await prisma.ship.findUnique({ where: { id }, include: { images: true } });

    if (!existingShip) {
      res.status(404).json({ message: "Ship not found" });
      return;
    }
    const body = {
      ...req.body,
      isPublished: req.body.isPublished === "true",
    };
    // Validate body
    const parsed = EditShipSchema.parse(body);

    const files = req.files as
      | {
          mainImage?: Express.Multer.File[];
          images?: Express.Multer.File[];
        }
      | undefined;

    let mainImageUrl = existingShip.mainImage;
    let mainImageId = existingShip.mainImagePublicId;

    /* ---------------- MAIN IMAGE UPDATE ---------------- */
    if (files?.["mainImage"]?.[0]?.buffer) {
      //Delete old image from cloudinary
      if (mainImageId) {
        await cloudinary.uploader.destroy(mainImageId);
      }

      //upload new main image
      const uploadMainImage = await uploadSingleFile(files["mainImage"][0].buffer, "ship/mainImage");

      mainImageUrl = uploadMainImage?.url;
      mainImageId = uploadMainImage?.publicId;
    }

    /* ---------------- DELETE IMAGES ---------------- */
    //let deleteImageIds: string[] = [];
    let deleteImageIds: string[] = [];

    try {
      deleteImageIds = JSON.parse(req.body.deleteImageIds || "[]");
    } catch {
      deleteImageIds = [];
    }

    if (deleteImageIds.length) {
      const imagesToDelete = existingShip.images.filter((img) => deleteImageIds.includes(img.id));

      for (const img of imagesToDelete) {
        if (img.publicId) {
          await cloudinary.uploader.destroy(img.publicId);
        }
      }

      await prisma.shipImages.deleteMany({
        where: {
          id: { in: deleteImageIds },
          shipId: id,
        },
      });
    }

    // 2. remove them from arrays

    /* Multiple image update */
    let newImages: any[] = [];
    if (files?.images?.length) {
      //const newImages = await uploadMultipleFiles(files["images"], "ship/images");
      const newUploads = await uploadMultipleFiles(files.images, "ship/images");

      let imagesMeta: { alt?: string }[] = [];

      try {
        imagesMeta = JSON.parse(req.body.imagesMeta || "[]");
      } catch {
        imagesMeta = [];
      }

      newImages = newUploads.map((img, index) => ({
        alt: imagesMeta[index]?.alt || "",
        url: img.url,
        publicId: img.publicId,
      }));
    }

    let existingImagesMeta: { id: string; alt?: string }[] = [];

    try {
      existingImagesMeta = JSON.parse(req.body.existingImagesMeta || "[]");
    } catch {
      existingImagesMeta = [];
    }

    await Promise.all(
      existingImagesMeta.map((img) =>
        prisma.shipImages.updateMany({
          where: { id: img.id, shipId: id },
          data: { alt: img.alt ?? "" },
        }),
      ),
    );

    const updatedShip = await prisma.ship.update({
      where: { id },
      data: {
        ...parsed,
        mainImage: mainImageUrl,
        mainImagePublicId: mainImageId,
        mainImageAlt: req.body.mainImageAlt ?? existingShip.mainImageAlt,
        images: {
          create: newImages.map((img) => ({
            alt: img.alt,
            url: img.url,
            publicId: img.publicId,
          })),
        },
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
    const ship = await prisma.ship.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!ship) {
      res.status(404).json({ message: "Ship not found" });
    }

    const galleryPublicIds = ship?.images?.map((img: any) => img.publicId) || [];
    const bannerPublicId = ship?.mainImagePublicId;

    const allPublicIds = [...galleryPublicIds, bannerPublicId].filter(Boolean);

    // 2. Delete from Cloudinary (parallel)
    await Promise.all(allPublicIds.map((publicId) => cloudinary.uploader.destroy(publicId)));

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

/* 
COUNT PENDING SHIPS AWAITING APPROVEAL
Admin only
*/
export const pendingCountShips = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = parsePagination(req.query);

    const [data, count] = await Promise.all([
      await prisma.ship.findMany({
        skip,
        take: limit,
        where: {
          listingStatus: "PENDING",
        },
      }),

      await prisma.ship.count({
        where: {
          listingStatus: "PENDING",
        },
      }),
    ]);

    const meta = buildPageMeta(count, page, limit);

    res.status(200).json({ meta, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* 
REVIEW NEW SHIP BY ADMIN. CAN BE REJECT OR VERIFED
Admin only
*/
export const reviewApprovalShip = async (req: Request<{ shipId: string }>, res: Response): Promise<void> => {
  const { shipId } = req.params;
  const { status, rejectionReason } = req.body;
  const user = req.user;

  if (!shipId) {
    res.status(400).json({
      message: "Ship id is required",
    });
    return;
  }

  if (!user) {
    res.status(401).json({
      message: "Unauthenticated",
    });
    return;
  }

  if (user.role !== "ADMIN") {
    res.status(403).json({
      message: "You are not authorized to review vessels",
    });
    return;
  }

  if (status !== ListingStatus.VERIFIED && status !== ListingStatus.REJECTED) {
    res.status(400).json({ message: "Invalid listing status" });
    return;
  }

  if (status === ListingStatus.REJECTED && (!rejectionReason || !rejectionReason.trim())) {
    res.status(400).json({ message: "Rejection reason is required" });
    return;
  }

  try {
    const ship = await prisma.ship.findUnique({
      where: {
        id: shipId,
      },
    });

    if (!ship) {
      res.status(404).json({ message: "Vessel not found" });
      return;
    }

    if (ship.listingStatus !== ListingStatus.PENDING) {
      res.status(400).json({ message: "This vessel has already been reviewed" });
      return;
    }

    const updatedShip = await prisma.ship.update({
      where: {
        id: shipId,
      },
      data: {
        listingStatus: status,
        //isPublished: status === ListingStatus.VERIFIED,
        verifiedAt: status === ListingStatus.VERIFIED ? new Date() : null,
        verifiedBy: status === ListingStatus.VERIFIED ? user.id : null,
        rejectionReason: status === ListingStatus.REJECTED ? rejectionReason.trim() : null,
      },
    });

    res.status(200).json({
      message: status === ListingStatus.VERIFIED ? "Vessel approved and published" : "Vessel rejected",
      data: updatedShip,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({
      message: "Internal server error",
    });
  }
};
