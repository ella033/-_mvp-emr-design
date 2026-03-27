export const vitalSignItemsApi = {
  list: (isActive?: boolean) =>
    `/vital-sign-items${isActive !== undefined ? `?isActive=${isActive ? "true" : "false"}` : ""}`,
  create: "/vital-sign-items",
  deleteUpsertMany: () => `/vital-sign-items/settings/delete-upsert-many`,
  update: (id: string) => `/vital-sign-items/${id}`,
  delete: (id: string) => `/vital-sign-items/${id}`,
};
