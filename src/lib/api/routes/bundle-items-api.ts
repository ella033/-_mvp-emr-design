export const bundleItemsApi = {
  list: (queryString: string) =>
    `/bundle-items/tree${queryString ? `?${queryString}` : ""}`,
  detail: (id: number, baseDate: string) =>
    `/bundle-items/${id}?baseDate=${baseDate}`,
  upsert: (existingId?: string) =>
    existingId ? `/bundle-items?existingId=${existingId}` : "/bundle-items",
  move: (id: number) => `/bundle-items/${id}/move`,
  rename: (id: number) => `/bundle-items/${id}/rename`,
  toggleActive: (id: number) => `/bundle-items/${id}/toggle-active`,
  toggleFavorite: (id: number) => `/bundle-items/${id}/toggle-favorite`,
  delete: (id: number) => `/bundle-items/${id}`,
};
