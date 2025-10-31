import { Request, Response } from "express";
import prisma from "../prismaClient";
import { paymentFilters } from "../utils/paymentFilters";
import { buildPageMeta, parsePagination } from "../utils/pagination";

/* Get all payments
    ADMIN ONLY
*/
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { page, limit, skip } = parsePagination(req.query);
    const { where } = paymentFilters(req.query);

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.payment.count(),
    ]);

    const meta = buildPageMeta(total, page, limit);

    res.status(200).json({ meta, payload: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
