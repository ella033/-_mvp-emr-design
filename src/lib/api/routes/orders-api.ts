export const ordersApi = {
  detail: (id: string) => `/orders/${id}`,
  listByEncounter: (encounterId: string) => `/orders/encounters/${encounterId}`,
  create: "/orders",
  deleteUpsertManyByEncounter: (encounterId: string) =>
    `/orders/encounters/${encounterId}/delete-upsert-many`,
  update: (id: string) => `/orders/${id}`,
  delete: (id: string) => `/orders/${id}`,
};
