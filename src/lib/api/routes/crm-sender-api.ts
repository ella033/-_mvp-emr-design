export const crmSenderApi = {
  getSenders: "/crm-sender",
  createSender: "/crm-sender",
  updateSender: (senderNumber: string) => `/crm-sender/${senderNumber}`,
  deleteSender: (senderNumber: string) => `/crm-sender/${senderNumber}`,
};
