export const prescriptionUserCodeApi = {
  list: (queryString: string) => `/prescription-user-codes?${queryString}`,
  searchAll: (queryString: string) =>
    `/prescription-user-codes/search-all?${queryString}`,
  detail: (id: number) => `/prescription-user-codes/${id}`,
  upsert: (existingId?: string) =>
    existingId
      ? `/prescription-user-codes/upsert?existingId=${existingId}`
      : "/prescription-user-codes/upsert",
  toggleActive: (id: number, isActive: boolean) =>
    `/prescription-user-codes/${id}/toggle-active?isActive=${isActive ? "true" : "false"}`,
  toggleActiveMultiple: () => `/prescription-user-codes/toggle-active-multiple`,
  delete: (id: string) => `/prescription-user-codes/${id}`,
  deleteMultiple: () => `/prescription-user-codes/delete-multiple`,
};
