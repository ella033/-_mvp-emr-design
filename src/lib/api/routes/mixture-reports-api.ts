export const mixtureReportsApi = {
  list: () => "/mixture-reports",
  nextApplicationNumber: () => "/mixture-reports/next-application-number",
  detail: (id: string) => `/mixture-reports/${id}`,
  save: () => "/mixture-reports",
  transmit: (id: string) => `/mixture-reports/${id}/transmit`,
};
