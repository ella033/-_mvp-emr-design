export const vitalSignSubItemsApi = {
  list: (itemId: string) => `/vital-sign-sub-items/items/${itemId}`,
  create: "/vital-sign-sub-items",
  update: (id: string) => `/vital-sign-sub-items/${id}`,
  delete: (id: string) => `/vital-sign-sub-items/${id}`,
};
