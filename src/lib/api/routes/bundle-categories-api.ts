export const bundleCategoriesApi = {
  list: "/bundle-categories",
  create: "/bundle-categories",
  update: (id: number) => `/bundle-categories/${id}`,
  move: (id: number) => `/bundle-categories/${id}/move`,
  delete: (id: number) => `/bundle-categories/${id}`,
};
