import { Request, Response } from "express";
import prisma from "../prismaClient";
import { paymentFilters } from "../utils/paymentFilters";
import { buildPageMeta } from "../utils/pagination";
import { PaymentFilterSchema } from "../schemas/payment.schema";

/* Get all payments
    ADMIN ONLY
*/
export const getPayments = async (req: Request, res: Response): Promise<void> => {
  try {
    const result = PaymentFilterSchema.safeParse(req.query);

    if (!result.success) {
      res.status(400).json({
        message: "Invalid filters",
        errors: result.error.flatten(),
      });

      return;
    }

    const filters = result.data;

    const { where } = paymentFilters(filters);
    const skip = (filters.page - 1) * filters.limit;

    const [data, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { [filters.sortBy]: filters.order },
      }),
      prisma.payment.count(),
    ]);

    const meta = buildPageMeta(total, filters.page, filters.limit);

    res.status(200).json({ meta, payload: data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
  }
};

/* Delete payment by id,admin only */
export const deletePayment = async (req: Request<{ id: string }>, res: Response) => {
  const { id } = req.params;
  if (!id) {
    res.status(404).json({ message: "Payment id not found" });
  }

  try {
    const payment = await prisma.payment.findUnique({ where: { id } });
    if (!payment) {
      res.status(404).json({ message: "Payment not found" });
    }
    await prisma.payment.delete({
      where: { id },
    });

    res.status(200).json({
      message: "Payment deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
