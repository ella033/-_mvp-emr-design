export const patientGroupsApi = {
  list: "/patient-groups",
  detail: (id: string) => `/patient-groups/${id}`,
  detailPatient: (id: string) => `/patient-groups/${id}/patients`,
  create: "/patient-groups",
  update: (id: string) => `/patient-groups/${id}`,
  delete: (id: string) => `/patient-groups/${id}`,
};