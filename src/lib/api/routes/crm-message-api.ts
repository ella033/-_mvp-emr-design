export const crmMessageApi = {
  send: "/crm-message-send",
  sendEligibilityCheck: "/crm-message-send/send-eligibility-check",
  cancel: (sendHistoryId: number) => `/crm-message-send/${sendHistoryId}/cancel`,
  reRegistration: (sendHistoryId: number) => `/crm-message-send/${sendHistoryId}/re-registration`,
  resend: (sendHistoryId: number) => `/crm-message-send/${sendHistoryId}/resend`,
};
