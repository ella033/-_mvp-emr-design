export const eligibilityApi = {
  detail: (id: string) => `/eligibility-checks/${id}`,
  qualifications: () => "/eligibility-checks/qualifications",

  create: (patientId?: number) => {
    const baseUrl = "/eligibility-checks";
    if (patientId) {
      return `${baseUrl}?patientId=${patientId}`;
    }
    return baseUrl;
  },
  update: (id: string) => `/eligibility-checks/${id}`,
  delete: (id: string) => `/eligibility-checks/${id}`,
};
