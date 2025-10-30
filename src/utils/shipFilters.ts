import { parseDate } from "../helpers/date.helpers";

// src/utils/shipFilters.ts
export const shipFilters = (query: any) => {
  const { price, shipType, dateFrom, dateTo, isPublished, search } = query;

  const where: any = {};

  if (search && typeof search === "string" && search.trim().length > 0) {
    where.OR = [{ shipName: { contains: search.trim(), mode: "insensitive" } }];
  }

  // Is published
  if (isPublished === "true") {
    where.isPublished = true;
  } else if (isPublished === "false") {
    where.isPublished = false;
  }

  if (price) {
    // Price
    const [min, max] = price.split("-").map(Number);
    where.price = {};
    if (!isNaN(min)) where.price.gte = min;
    if (!isNaN(max)) where.price.lte = max;
  }

  // Ship type
  if (shipType) {
    where.shipType = {
      in: shipType.split(",").map((t: string) => t.trim()),
    };
  }

  // Date range
  const dateFromInit = parseDate(dateFrom);
  const dateToInit = parseDate(dateTo);

  where.createdAt = {
    ...(dateFromInit && { gte: dateFromInit }),
    ...(dateToInit && { lte: dateToInit }),
  };

  return where;
};
