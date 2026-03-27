export const vaccinationUserCodesApi = {
  list: (keyword: string) => `/vaccination-user-codes?keyword=${keyword}`,
  detail: (id: number) => `/vaccination-user-codes/${id}`,
  upsert: (existingId: number) =>
    existingId
      ? `/vaccination-user-codes?existingId=${existingId}`
      : "/vaccination-user-codes",
  toggleActive: (id: number, isActive: boolean) =>
    `/vaccination-user-codes/${id}/toggle-active?isActive=${isActive ? "true" : "false"}`,
  delete: (id: string) => `/vaccination-user-codes/${id}`,
};
