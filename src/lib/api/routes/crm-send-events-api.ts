export const crmSendEventsApi = {
  getSendEvents: "/crm-send-events",
  getSendEventById: (id: number) => `/crm-send-events/${id}`,
  createEvent: "/crm-send-events",
  updateEvent: (id: number) => `/crm-send-events/${id}`,
  deleteEvent: (id: number) => `/crm-send-events/${id}`,
};
