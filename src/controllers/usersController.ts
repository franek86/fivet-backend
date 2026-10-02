import { Request, Response, NextFunction } from "express";
import { Role } from "@prisma/client";
import { parseSortBy } from "../helpers/sort.helpers";
import prisma from "../prismaClient";

import { buildPageMeta, parsePagination } from "../utils/pagination";
import { NotFoundError, ValidationError } from "../helpers/error.helpers";
import { logger } from "../config/logger";
import { UpdateVerifyUserSchema } from "../schemas/updateVerifyUser.schema";
import { onlineUsers } from "../services/socket.service";
import { UserFilterSchema, UserFilterType } from "../schemas/user.schema";

/* GET ALL USERS, ADMIN ONLY */
export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const result = UserFilterSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const whereCondition: any = {};
    const skip = (filters.page - 1) * filters.limit;

    if (filters.search && typeof filters.search === "string" && filters.search.trim().length > 0) {
      const search = filters.search.trim();

      whereCondition.OR = [
        {
          fullName: {
            contains: search,
            mode: "insensitive",
          },
          email: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        where: whereCondition,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
        select: {
          id: true,
          fullName: true,
          email: true,
          isActive: true,
          subscription: true,
          lastLogin: true,
          avatar: true,
          createdAt: true,
          company: true,
          brokerProfile: true,
          ownerProfile: true,
        },
      }),
      prisma.user.count(),
    ]);

    const meta = buildPageMeta(totalUsers, filters.page, filters.limit);

    const usersWithStatus = users.map((u: any) => ({
      ...u,
      online: onlineUsers.has(u.id),
    }));

    res.status(200).json({
      meta,
      users: usersWithStatus,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET OWNERS */
export const getAllOwners = async (req: Request, res: Response): Promise<void> => {
  const brokerId = req.user?.id;

  const result = UserFilterSchema.safeParse(req.query);

  if (!result.success) {
    res.status(400).json({
      message: "Invalid filters",
      errors: result.error.flatten(),
    });

    return;
  }

  const filters = result.data as UserFilterType;

  const whereCondition: any = {};
  const skip = (filters.page - 1) * filters.limit;

  if (filters.search && typeof filters.search === "string" && filters.search.trim().length > 0) {
    whereCondition.OR = [
      {
        fullName: {
          contains: filters.search.trim(),
          mode: "insensitive",
        },
      },
    ];
  }

  try {
    const [owners, totalOwners] = await Promise.all([
      await prisma.user.findMany({
        where: {
          role: "OWNER",

          ownerProfile: {
            verificationStatus: "VERIFIED",
          },
        },
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
        select: {
          id: true,
          fullName: true,
          company: {
            select: {
              name: true,
              legalName: true,
              logo: true,
              city: true,
              country: true,
            },
          },
          ownerProfile: {
            select: {
              verificationStatus: true,
            },
          },

          ownerRequestsReceived: {
            where: {
              brokerId,
            },
            select: {
              id: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
            take: 1,
          },
        },
      }),

      await prisma.user.count(),
    ]);

    const meta = buildPageMeta(totalOwners, filters.page, filters.limit);

    res.status(200).json({ meta, owners });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET LAST FIVE CREATED PROFILE */
export const getLastFiveProfile = async (req: Request, res: Response) => {
  try {
    const data = await prisma.user.findMany({
      select: {
        id: true,
        fullName: true,
        email: true,
        isActive: true,
        subscription: true,
        avatar: true,
        lastLogin: true,
        createdAt: true,
      },

      orderBy: { createdAt: "desc" },
      take: 5,
    });

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

export const updateVerifyUserByAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    /*  const adminId = req.user?.id;
    if (!adminId) {
      logger.warn("User id missing");
      throw new ValidationError("Unauthorize");
    } */

    const parseData = UpdateVerifyUserSchema.safeParse(req.body);
    if (!parseData.success) {
      logger.warn("Verify user by admin validation failed");
      return next(parseData.error.flatten().fieldErrors);
    }

    const { userId, verificationStatus } = parseData.data;

    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        fullName: true,
        email: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundError("User not found");
    }

    if (targetUser.role !== Role.BROKER && targetUser.role !== Role.OWNER) {
      throw new ValidationError("Only Broker or Owner accounts can be verified.");
    }

    const verifyAt = verificationStatus === "VERIFIED" ? new Date() : null;

    let updatedProfile;

    if (targetUser.role === Role.BROKER) {
      updatedProfile = await prisma.brokerProfile.update({
        where: { userId: targetUser.id },
        data: {
          verificationStatus,
          verifiedAt: verifyAt,

          // rejectionReason, // uncomment once the field exists on BrokerProfile
        },
      });
    } else {
      updatedProfile = await prisma.ownerProfile.update({
        where: { userId: targetUser.id },
        data: {
          verificationStatus,
          verifiedAt: verifyAt,
        },
      });
    }

    // Notify the user of the outcome — adjust to however Notification is modeled
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        type: "INFO",
        message: verificationStatusDefaultBody(verificationStatus),
      },
    });

    logger.info(`Admin set ${targetUser.role} ${targetUser.id} verification to ${verificationStatus}`);

    res.status(200).json({
      success: true,
      message: "Verification status updated.",
      profile: updatedProfile,
    });
  } catch (error) {
    logger.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getSingleUserProfile = async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      logger.warn("User id missing");
      throw new ValidationError("Unauthorize");
    }

    const data = await prisma.user.findUnique({
      where: { id },
      include: {
        brokerProfile: true,
        ownerProfile: true,
        company: true,
      },
      omit: {
        password: true,
      },
    });

    res.status(200).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* GET VERIFIED BROKER LIST OF OWNER */
export const getVerifiedBrokerList = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, skip, limit } = parsePagination(req.query);
    const { sortBy, search } = req.query;
    const orderBy = parseSortBy(sortBy as string, ["status", "createdAt"], { createdAt: "desc" });

    const whereCondition: any = {};

    if (search && typeof search === "string" && search.trim().length > 0) {
      whereCondition.OR = [
        {
          fullName: {
            contains: search.trim(),
            mode: "insensitive",
          },
        },
      ];
    }

    const [brokers, totalBrokers] = await Promise.all([
      await prisma.user.findMany({
        where: {
          role: "BROKER",

          brokerProfile: {
            verificationStatus: "VERIFIED",
          },
        },
        skip,
        take: limit,
        select: {
          id: true,
          fullName: true,

          company: {
            select: {
              name: true,
              legalName: true,
              logo: true,
              city: true,
              country: true,
            },
          },
          brokerProfile: {
            select: {
              verificationStatus: true,
            },
          },
          brokerRequestsSent: {
            where: {
              ownerId: req.user?.userId,
            },
            select: {
              id: true,
              status: true,
              ownerId: true,
            },
          },
        },
        orderBy,
      }),

      await prisma.user.count(),
    ]);

    const meta = buildPageMeta(totalBrokers, page, limit);

    res.status(200).json({ meta, brokers });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

function verificationStatusDefaultBody(status: string): string {
  switch (status) {
    case "VERIFIED":
      return "Your account has been verified. You now have full access.";
    case "REJECTED":
      return "Your verification was rejected. Please review and resubmit.";
    case "SUSPENDED":
      return "Please provide additional documents to continue verification.";
    default:
      return "Your verification status has changed.";
  }
}
