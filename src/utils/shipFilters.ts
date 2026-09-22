import { ShipFilters } from "../schemas/shipFilter.schema";
import { parseDate } from "../helpers/date.helpers";
import { Prisma } from "@prisma/client";

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
export const shipFilters = (filters: ShipFilters) => {
  const { shipType, search, isPublished, minPrice, maxPrice } = filters;

  const where: Prisma.ShipWhereInput = {};

  if (search) {
    const trimmed = search.trim();

    if (trimmed.length > 0) {
      const orConditions: Prisma.ShipWhereInput[] = [
        {
          shipName: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      ];

      const imo = Number(trimmed);

      if (!Number.isNaN(imo)) {
        orConditions.push({
          imo,
        });
      }

      where.OR = orConditions;
    }
  }

  // Is published
  if (isPublished !== undefined) {
    where.isPublished = isPublished;
  }

  // Price
  if (minPrice !== undefined || maxPrice !== undefined) {
    where.price = {
      ...(minPrice !== undefined && { gte: minPrice }),
      ...(maxPrice !== undefined && { lte: maxPrice }),
    };
  }

  // Ship type
  if (shipType.length > 0) {
    where.shipType = {
      name: { in: shipType },
    };
  }

  return where;
};
