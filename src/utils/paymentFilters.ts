import { PaymentStatus } from "@prisma/client";
import { parseDate } from "../helpers/date.helpers";

export const paymentFilters = (query: any) => {
  const where: any = {};

  // Filter by status PENDING ,PAID, FAILED ,CANCELED
  if (query.status) {
    const status = (query.status as string).toUpperCase();

    if (Object.values(PaymentStatus).includes(status as PaymentStatus)) {
      where.status = status as PaymentStatus;
    }
  }

  //Filter by date range
  const dateFrom = parseDate(query.dateFrom);
  const dateTo = parseDate(query.dateTo);

  where.createdAt = {
    ...(dateFrom && { gte: dateFrom }),
    ...(dateTo && { lte: dateTo }),
  };

  return { where };
};
