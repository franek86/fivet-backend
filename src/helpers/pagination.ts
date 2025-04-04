import { ParsedQs } from "qs";

export const getPaginationParams = (query: ParsedQs) => {
  const pageNumber: number = parseInt(query.page as string) || 1;
  const pageSize: number = parseInt(query.limit as string) || 10;
  const skip: number = (pageNumber - 1) * pageSize;

  return { pageNumber, pageSize, skip };
};
