export const patientFamiliesApi = {
  detail: (id: string) => `/patient-families/${id}`,
  listByPatient: (patientId: string) =>
    `/patient-families/patients/${patientId}`,
  create: "/patient-families",
  deleteUpsertManyByPatient: (patientId: string) =>
    `/patient-families/patients/${patientId}/delete-upsert-many`,
  update: (id: string) => `/patient-families/${id}`,
  delete: (id: string) => `/patient-families/${id}`,
};
