export const facilityApi = {
  list: (queryString: string) => `/facilities?${queryString}`,
  detail: (id: number) => `/facilities/${id}`,
  create: () => `/facilities`,
  update: (id: number) => `/facilities/${id}`,
  delete: (id: number) => `/facilities/${id}`,
};
