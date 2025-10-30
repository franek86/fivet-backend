import { Request, Response } from "express";
import prisma from "../prismaClient";
import { paymentFilters } from "../utils/paymentFilters";

/* Get all payments
    ADMIN ONLY
*/
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const { where } = paymentFilters(req.query);
    const data = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};
