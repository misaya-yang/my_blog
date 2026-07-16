export function getManagePagination(
  total: number,
  page: number,
  pageSize: number
) {
  const safeTotal = Math.max(0, Math.floor(total));
  const safePageSize = Math.max(1, Math.floor(pageSize));
  const totalPages = Math.max(1, Math.ceil(safeTotal / safePageSize));
  const safePage = Math.min(Math.max(1, Math.floor(page)), totalPages);
  const start =
    safeTotal === 0 ? 0 : (safePage - 1) * safePageSize + 1;
  const end = Math.min(safeTotal, safePage * safePageSize);

  return {
    page: safePage,
    pageSize: safePageSize,
    total: safeTotal,
    totalPages,
    start,
    end,
    hasPrevious: safePage > 1,
    hasNext: safePage < totalPages,
  };
}
