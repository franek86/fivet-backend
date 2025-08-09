// src/utils/shipFilters.ts
export const shipFilters = (query: any) => {
  const { price, shipType, dateFrom, dateTo, isPublished } = query;

  const filters: any = {};

  // Is published
  if (isPublished === "true") {
    filters.isPublished = true;
  } else if (isPublished === "false") {
    filters.isPublished = false;
  }

  if (price) {
    // Price
    const [min, max] = price.split("-").map(Number);
    filters.price = {};
    if (!isNaN(min)) filters.price.gte = min;
    if (!isNaN(max)) filters.price.lte = max;
  }

  // Ship type
  if (shipType) {
    filters.shipType = {
      in: shipType.split(",").map((t: string) => t.trim()),
    };
  }

  // Date range
  if (dateFrom || dateTo) {
    filters.createdAt = {};
    if (dateFrom) filters.createdAt.gte = new Date(dateFrom);
    if (dateTo) filters.createdAt.lte = new Date(dateTo);
  }

  return filters;
};
