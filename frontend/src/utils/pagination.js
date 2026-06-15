export const PAGE_SIZE_OPTIONS = [10, 25, 50];

export const paginate = (items, page, pageSize) => {
  const safePage = Math.max(page, 1);
  const start = (safePage - 1) * pageSize;
  return items.slice(start, start + pageSize);
};

export const pageCountFor = (items, pageSize) => Math.max(Math.ceil(items.length / pageSize), 1);
