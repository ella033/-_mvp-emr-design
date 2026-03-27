export const encountersApi = {
  detail: (id: string) => `/encounters/${id}`,
  issuanceNumber: (id: string, isRegenerate: boolean = false) =>
    `/encounters/${id}/issuance-number?isRegenerate=${isRegenerate ? "true" : "false"}`,
  listByPatient: (patientId: string, beginDate: string, endDate: string) =>
    `/encounters/patients/${patientId}?beginDate=${beginDate}&endDate=${endDate}`,
  listByRegistration: (registrationId: string, beginDate: string, endDate: string) =>
    `/encounters/registrations/${registrationId}?beginDate=${beginDate}&endDate=${endDate}`,
  create: "/encounters",
  update: (id: string, options?: { skipClaimSync?: boolean }) => {
    const skipClaimSync = options?.skipClaimSync ?? false;
    return `/encounters/${id}?skipClaimSync=${skipClaimSync ? "true" : "false"}`;
  },
  syncClaimDetail: (id: string) => `/encounters/${id}/sync-claim-detail`,
  delete: (id: string) => `/encounters/${id}`,
  checkRevisit: (patientId: string, baseDate: string) =>
    `/encounters/patients/${patientId}/check-revisit?baseDate=${baseDate}`,
  updateIssuanceNumber: (id: string) => `/encounters/${id}/issuance-number`,
};
