export const departmentApi = {
  list: () => `/departments`,
  create: "/departments",
  update: (id: string) => `/departments/${id}`,
  delete: (id: string) => `/departments/${id}`,
};
