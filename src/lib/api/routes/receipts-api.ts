export const receiptsApi = {
  list: (
    patientId: string,
    encounterId: string,
    settlementId: string,
    startDate: string,
    endDate: string
  ) => `/receipts?patientId=${patientId}&encounterId=${encounterId}&settlementId=${settlementId}&startDate=${startDate}&endDate=${endDate}`,
  detail: (id: string) => `/receipts/${id}`,
  cancel: (id: string) => `/receipts/${id}/cancel`,
  refund: (id: string) => `/receipts/${id}/refund`,
}