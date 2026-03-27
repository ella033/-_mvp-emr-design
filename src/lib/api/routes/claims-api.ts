export const claimsApi = {
  list: () => `/claims`,
  create: "/claims",
  generate: () => `/claims/generate`,
  update: (id: string) => `/claims/${id}`,
  delete: (id: string) => `/claims/${id}`,
  transmit: () => `/claims/transmit`,
  nextOrder: () => `/claims/next-order`,
  candidatePatients: () => `/claims/candidates/patients`,
  additionalClaimOrders: (patientId: string | number) =>
    `/claims/candidates/patients/${patientId}/orders`,
  details: (id: string) => `/claims/${id}/details`,
  reorderDetails: (id: string) => `/claims/${id}/details/reorder`,
  completion: (id: string) => `/claims/${id}/completion`,
  samFile: (id: string) => `/claims/${id}/sam-file`,
  updateLinkedClaimDetail: (claimId: string, detailId: string) =>
    `/claims/${claimId}/details/${detailId}`,
  destructionCandidates: () => `/claims/destruction-candidates`,
  destroy: () => `/claims/destroy`,
};
