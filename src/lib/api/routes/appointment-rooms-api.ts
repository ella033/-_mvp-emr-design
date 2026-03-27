export const appointmentRoomsApi = {
  list: "/v1/appointment-rooms",
  detail: (id: string) => `/v1/appointment-rooms/${id}`,
  create: "/v1/appointment-rooms",
  update: (id: string) => `/v1/appointment-rooms/${id}`,
  delete: (id: string) => `/v1/appointment-rooms/${id}`,
  createHoliday: (id: string) => `/v1/appointment-rooms/${id}/holidays`,
  updateHoliday: (id: string, holidayId: string) =>
    `/v1/appointment-rooms/${id}/holidays/${holidayId}`,
  deleteHoliday: (id: string, holidayId: string) =>
    `/v1/appointment-rooms/${id}/holidays/${holidayId}`,
  findAvailableSlots: (id: string, date: string, doctorId?: string) =>
    `/v1/appointment-rooms/${id}/available-slots?date=${date}${doctorId ? `&doctorId=${doctorId}` : ""}`,
  syncOpertingHoursMultiple: "/v1/appointment-rooms/operating-hours/sync-multiple",

};
