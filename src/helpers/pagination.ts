interface IPaginationQuery {
  page?: string;
  limit?: string;
}

export const getPaginationParams = (query: IPaginationQuery) => {
  const pageNumber: number = parseInt(query.page as string) || 1;
  const pageSize: number = parseInt(query.limit as string) || 10;
  const skip: number = (pageNumber - 1) * pageSize;

  return { pageNumber, pageSize, skip };
};
