export function parsePagination(query: any) {
  const page = Math.max(1, parseInt((query.page as string) ?? "1", 1));
  const limit = Math.min(100, Math.max(1, parseInt((query.limit as string) ?? "12", 12)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function buildPageMeta(total: number, page: number, limit: number) {
  return { total, page, limit, totalPages: Math.ceil(total / limit) };
}
