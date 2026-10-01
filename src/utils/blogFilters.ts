import { BlogFilters } from "src/schemas/post.schema";

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
export const blogFilters = (query: BlogFilters) => {
  const { categories, tags, dateFrom, dateTo, status, search } = query;

  const where: any = {};

  //Blog search
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

      where.AND = [...(where.AND || []), { OR: orConditions }];
    }
  }

  // Blog status
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
  const dateFromInit = dateFrom;
  const dateToInit = dateTo;

  where.createdAt = {
    ...(dateFromInit && { gte: dateFromInit }),
    ...(dateToInit && { lte: dateToInit }),
  };

  return where;
};
