export const templateCodeApi = {
  list: () => `/template-codes`,
  detail: (code: string) => `/template-codes/codes/${code}`,
  create: "/template-codes",
  update: (id: number) => `/template-codes/${id}`,
  delete: (id: number) => `/template-codes/${id}`,
};
