export const holidayMastersApi = {
  list: "/v1/holiday-masters",
  detail: (id: string) => `/v1/holiday-masters/${id}`,
  create: "/v1/holiday-masters",
  update: (id: string) => `/v1/holiday-masters/${id}`,
  delete: (id: string) => `/v1/holiday-masters/${id}`,
  findInstancesByYear: (year: string) =>
    `/v1/holiday-masters/instances/by-year?year=${year}`,
};
