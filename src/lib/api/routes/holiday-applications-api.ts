export const holidayApplicationsApi = {
  list: "/v1/holiday-applications",
  detail: (id: number) => `/v1/holiday-applications/${id}`,
  update: (id: number) => `/v1/holiday-applications/${id}`,
  delete: (id: number) => `/v1/holiday-applications/${id}`,
};