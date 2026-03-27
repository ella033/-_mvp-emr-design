export const materialReportsApi = {
  list: () => "/material-reports",
  nextApplicationNumber: () => "/material-reports/next-application-number",
  detail: (id: string) => `/material-reports/${id}`,
  save: () => "/material-reports",
  transmit: (id: string) => `/material-reports/${id}/transmit`,
};
