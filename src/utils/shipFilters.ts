import { parseDate } from "../helpers/date.helpers";

/**
@desc Accepts a string in the format `"min-max"` and converts it into an object
 * containing `gte` (greater than or equal) and/or `lte` (less than or equal)
 * values.
@param value - A range string formatted as `"min-max"`
@returns An object containing `gte` and/or `lte` numeric properties based on
 * the parsed range. Returns an empty object if no valid numbers are found.
*/
const parseRange = (value: string) => {
  const [min, max] = value.split("-").map(Number);
  const range: any = {};

  if (!isNaN(min)) range.gte = min;
  if (!isNaN(max)) range.lte = max;

  return range;
};

/**
 * @desc
 * Accepts a query object (typically from request query params) and conditionally
 * constructs a filter object used for database queries (e.g. Prisma).
 * Only valid and provided filters are applied.
 *
 * @param query - An object containing query parameters used to filter ships.
 * Common properties include:
 *  - `search`: string for case-insensitive ship name search
 *  - `isPublished`: `"true"` | `"false"`
 *  - `price`: range string `"min-max"`
 *  - `shipType`: comma-separated ship type names
 *  - `beam`: range string `"min-max"`
 *  - `minTonnage`: minimum tonnage
 *  - `maxTonnage`: maximum tonnage
 *  - `dateFrom`: start date string
 *  - `dateTo`: end date string
 *
 * @returns A `where` filter object containing conditional query
 */
export const shipFilters = (query: any) => {
  const { beam, price, shipType, dateFrom, dateTo, isPublished, search, minTonnage, maxTonnage } = query;

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
    const shipTypeNames = shipType.split(",").map((t: string) => t.trim());

    where.shipType = {
      name: { in: shipTypeNames },
    };
  }

  //Beam
  if (beam) {
    const value = beam;
    where.beam = parseRange(value);
  }

  if (minTonnage) {
    where.tonnage = { gte: Number(minTonnage) };
  }

  if (maxTonnage) {
    where.tonnage = { gte: Number(maxTonnage) };
  }

  //Tonnage
  /*  if (tonnage) {
    const value = tonnage;
    where.tonnage = parseRange(value);
  } */

  // Date range
  const dateFromInit = parseDate(dateFrom);
  const dateToInit = parseDate(dateTo);

  where.createdAt = {
    ...(dateFromInit && { gte: dateFromInit }),
    ...(dateToInit && { lte: dateToInit }),
  };

  return where;
};
