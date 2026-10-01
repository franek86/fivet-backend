import { PaymentStatus } from "@prisma/client";
import { PaymentFilters } from "../schemas/payment.schema";

export const paymentFilters = (query: PaymentFilters) => {
  const where: any = {};

  // Search by stripePaymentId
  if (query.search && typeof query.search === "string" && query.search.trim().length > 0) {
    const trimmed = query.search.trim();

    if (trimmed.length > 0) {
      where.OR = [
        {
          stripePaymentId: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      ];
    }
  }

  // Filter by status PENDING ,PAID, FAILED ,CANCELED
  if (query.status) {
    const status = (query.status as string).toUpperCase();

    if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus;
    }
  }

  //Filter by date range
  const dateFrom = query.dateFrom;
  const dateTo = query.dateTo;

  where.createdAt = {
    ...(dateFrom && { gte: dateFrom }),
    ...(dateTo && { lte: dateTo }),
  };

  return { where };
};
