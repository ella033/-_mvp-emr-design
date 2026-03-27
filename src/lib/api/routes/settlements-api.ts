export const settlementsApi = {
  list: (patientId: string, encounterId: string, settlementId: string, startDate: string, endDate: string) => `/settlements?patientId=${patientId}&encounterId=${encounterId}&settlementId=${settlementId}&startDate=${startDate}&endDate=${endDate}`,
  detail: (id: string) => `/settlements/${id}`,
  cancel: (id: string) => `/settlements/${id}/cancel`,
  refund: (id: string) => `/settlements/${id}/refund`,
};