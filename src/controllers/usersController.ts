import { Request, Response, NextFunction } from "express";
import { parseSortBy } from "../helpers/sort.helpers";
import prisma from "../prismaClient";

import { buildPageMeta, parsePagination } from "../utils/pagination";

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { page, skip, limit } = parsePagination(req.query);
    const { sortBy } = req.query;
    const orderBy = parseSortBy(sortBy as string, ["status", "views", "createdAt"], { createdAt: "desc" });

    const [users, totalUsers] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy,
        select: {
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
      prisma.post.count(),
    ]);

    const meta = buildPageMeta(totalUsers, page, limit);

    res.status(200).json({
      meta,
      users,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
