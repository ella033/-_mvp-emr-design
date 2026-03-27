export const slotClosuresApi = {
  list: (queryString: string) => `/v1/slot-closures?${queryString}`,
  detail: (id: string) => `/v1/slot-closures/${id}`,
  create: "/v1/slot-closures",
  update: (id: string) => `/v1/slot-closures/${id}`,
  delete: (id: string) => `/v1/slot-closures/${id}`,
};
