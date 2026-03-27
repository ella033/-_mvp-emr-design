export const diseaseLibrariesApi = {
  search: (queryString: string) => `/disease-libraries?${queryString}`,
  detail: (id: number) => `/disease-libraries/${id}`,
};
