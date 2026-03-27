export type RegistrationListOptions = {
  examHas?: boolean;
};

export const registrationsApi = {
  detail: (id: string) => `/registrations/${id}`,
  charts: (id: string) => `/registrations/${id}/charts`,
  listByHospital: (
    hospitalId: string,
    beginDate: string,
    endDate: string,
    options?: RegistrationListOptions
  ) => {
    const params = new URLSearchParams({
      beginDate,
      endDate,
    });

    if (options?.examHas) {
      params.append("examHas", "true");
    }

    return `/registrations/hospitals/${hospitalId}?${params.toString()}`;
  },
  listByPatient: (patientId: string, beginDate: string, endDate: string) =>
    `/registrations/patients/${patientId}?beginDate=${beginDate}&endDate=${endDate}`,
  create: "/registrations",
  update: (id: string) => `/registrations/${id}`,
  delete: (id: string) => `/registrations/${id}`,
  latestRegistration: (patientId: string, baseDate?: string) => {
    const url = `/registrations/patients/${patientId}/latest`;
    if (baseDate) {
      const params = new URLSearchParams({ baseDate });
      return `${url}?${params.toString()}`;
    }
    return url;
  },
  movePosition: () => `/registrations/move`,
  updatePatientRouteStatus: (id: string) =>
    `/registrations/${id}/patient-route-status`,
  listPatientPrintAvailability: (patientId: string, beginDate: string, endDate: string) =>
    `/registrations/patients/${patientId}/print-availability?beginDate=${beginDate}&endDate=${endDate}`,
};
