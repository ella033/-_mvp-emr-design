export const vaccinationLibrariesApi = {
  list: (keyword: string) => `/vaccination-libraries?keyword=${keyword}`,
  detail: (id: number) => `/vaccination-libraries/${id}`,
  nipList: (keyword: string) =>
    `/vaccination-libraries/nip-libraries?keyword=${keyword}`,
};
