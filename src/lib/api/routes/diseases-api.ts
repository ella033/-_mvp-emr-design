export const diseasesApi = {
  detail: (id: string) => `/diseases/${id}`,
  listByEncounter: (encounterId: string) =>
    `/diseases/encounters/${encounterId}`,
  deleteUpsertManyByEncounter: (encounterId: string) =>
    `/diseases/encounters/${encounterId}/delete-upsert-many`,
  create: "/diseases",
  update: (id: string) => `/diseases/${id}`,
  delete: (id: string) => `/diseases/${id}`,
};
