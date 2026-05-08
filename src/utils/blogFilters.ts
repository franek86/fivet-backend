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
 *  - `search`: string for case-insensitive blog name search
 *  - `status`: `"DRAFT"` | `"PUBLISHED"`
 *  - `categories`: comma-separated category names
 *  - `tags`: comma-separated tag names
 *  - `dateFrom`: start date string
 *  - `dateTo`: end date string
 *
 * @returns A `where` filter object containing conditional query
 */
export const blogFilters = (query: any) => {
  const { categories, tags, dateFrom, dateTo, status, search } = query;

  const where: any = {};

  /* if (search && typeof search === "string" && search.trim().length > 0) {
    where.OR = [{ shipName: { contains: search.trim(), mode: "insensitive" } }, { imo: { contains: search.trim(), mode: "insensitive" } }];
  } */
  if (typeof search === "string") {
    const trimmed = search.trim();

    if (trimmed.length > 0) {
      const orConditions: any[] = [
        {
          title: {
            contains: trimmed,
            mode: "insensitive",
          },
          shortDescription: {
            contains: trimmed,
            mode: "insensitive",
          },
        },
      ];

      if (!isNaN(Number(trimmed))) {
        orConditions.push({
          imo: Number(trimmed),
        });
      }

      where.AND = [...(where.AND || []), { OR: orConditions }];
    }
  }

  // STATUS
  switch (status) {
    case "DRAFT":
      where.status = "DRAFT";
      break;
    case "PUBLISHED":
      where.status = "PUBLISHED";
      break;
    case "ARCHIVED":
      where.status = "ARCHIVED";
      break;
    default:
      where.status = "DRAFT";
      break;
  }
  // Blog categores
  if (categories) {
    const categoryTitle = categories.split(",").map((t: string) => t.trim());

    where.categories = {
      name: { in: categoryTitle },
    };
  }

  // Blog tags
  if (tags) {
    const tagsList = tags.split(",").map((t: string) => t.trim());

    where.tags = {
      name: { in: tagsList },
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
