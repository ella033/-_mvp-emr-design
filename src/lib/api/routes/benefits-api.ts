export const benefitsApi = {
  list: "/benefits",
  detail: (id: string) => `/benefits/${id}`,
  create: "/benefits",
  update: (id: string) => `/benefits/${id}`,
  delete: (id: string) => `/benefits/${id}`,
};