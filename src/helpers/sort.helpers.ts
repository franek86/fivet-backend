type SortDirection = "asc" | "desc";

export const parseSortBy = (
  sortBy: string,
  allowedFields: string[] = [],
  defaultSort: Record<string, SortDirection> = { createdAt: "desc" }
): Record<string, SortDirection>[] => {
  if (!sortBy || typeof sortBy !== "string") return [defaultSort];

  const sortParse = sortBy.split(",");

  const parsed = sortParse
    .map((part) => {
      const [field, direction] = part.split("-");
      if (allowedFields.includes(field) && ["asc", "desc"].includes(direction)) {
        return { [field]: direction as SortDirection };
      }
      return null;
    })
    .filter(Boolean) as Record<string, SortDirection>[];
  return parsed.length > 0 ? parsed : [defaultSort];
};
