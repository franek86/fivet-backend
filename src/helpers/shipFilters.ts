// src/utils/shipFilters.ts
export const shipFilters = (query: any) => {
  const { minPrice, maxPrice, shipType, dateFrom, dateTo } = query;

  const filters: any = {};

  // Price
  if (minPrice || maxPrice) {
    filters.price = {};
    if (minPrice) filters.price.gte = parseFloat(minPrice);
    if (maxPrice) filters.price.lte = parseFloat(maxPrice);
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
