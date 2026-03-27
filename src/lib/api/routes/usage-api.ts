export const usageApi = {
  list: () => `/usage-codes`,
  create: "/usage-codes",
  update: (id: string) => `/usage-codes/${id}`,
  delete: (id: string) => `/usage-codes/${id}`,
};
