export const prohibitedDrugsApi = {
  get: (drugId: string) => `/prohibited-drugs/${drugId}`,
  list: (patientId: number) => `/prohibited-drugs/patients/${patientId}`,
  create: () => `/prohibited-drugs`,
  deleteUpsertMany: (patientId: number) =>
    `/prohibited-drugs/patients/${patientId}/delete-upsert-many`,
  update: (id: number) => `/prohibited-drugs/${id}`,
  delete: (id: number) => `/prohibited-drugs/${id}`,
};
